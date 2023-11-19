import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Photo } from '@capacitor/camera';
import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';
import * as faceapi from 'face-api.js';
import { PhotoService } from '../services/photo.service';


var fs = require('fs');

var Buffer = require('buffer/').Buffer;
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {


  @ViewChild('imageCanvas', { static: false }) canvas: ElementRef;
  @ViewChild('img', { static: false }) img: ElementRef;
  @ViewChild(Platform, { static: false }) content: Platform;
  private ctx: CanvasRenderingContext2D;
  imgSrc: string = '';
  messages: string[] = [];

  constructor(public photoService: PhotoService, private file: File) { }

  addPhotoToGallery() {
    this.photoService.addNewToGallery().then((photo: Photo) => {
      this.imgSrc = photo.webPath;


    });
  }
  onImageLoad($event: any) {
    if (this.imgSrc != '') {
      this.canvas.nativeElement.width = this.img.nativeElement.width;
      this.canvas.nativeElement.height = this.img.nativeElement.height;
      // this.ctx = this.canvas.nativeElement.getContext('2d');
      // this.ctx.drawImage(this.img.nativeElement, 0, 0);
      this.faceDectection();
    }
  }
  async faceDectection() {
    let faceDescriptions = await faceapi.detectAllFaces(this.img.nativeElement).withFaceLandmarks().withFaceDescriptors().withFaceExpressions()

    faceapi.matchDimensions(this.canvas.nativeElement, this.img.nativeElement);

    faceDescriptions = faceapi.resizeResults(faceDescriptions, this.img.nativeElement);
    faceapi.draw.drawDetections(this.canvas.nativeElement, faceDescriptions);
    faceapi.draw.drawFaceLandmarks(this.canvas.nativeElement, faceDescriptions);
    faceapi.draw.drawFaceExpressions(this.canvas.nativeElement, faceDescriptions);

  }


  ngOnInit() {
    this.loadModels();
  }

  async loadModels() {
    // set path to load models
    let filePathRoot = '/assets/models/';

    // faceapi settings
    faceapi.env.monkeyPatch({
      readFile: filePath =>
        new Promise(resolve => {
          let fileExtension = filePath.split("?")[0].split(".").pop();
          let fileName = filePath.split("?")[0].split("/").pop();
          this.messages.push('readFile-> ' + filePathRoot + fileName);
         // resolve(fs.readFileSync(filePathRoot + fileName));
          // readFile(filePathRoot + fileName, (error:any,data:Buffer)=>{
          //   resolve(data);
          // })
          fetch(filePathRoot + fileName)
            .then(response => {

              if (fileExtension === "json") {
                this.messages.push('response reading json ');
                response.json().then( (value:any)=>{
                  this.messages.push('reading json fin ');
                  resolve(Buffer.from(JSON.stringify(value)));
                });
              } else {
                this.messages.push('response reading blob ');
               
                 response.blob().then( (value:any)=>{
                  this.messages.push('BLOB INICIO ');
                  let reader = new FileReader();
                  reader.onload = () => {
                    this.messages.push('BLOB FIN ');
                    resolve(Buffer.from(new Uint32Array(reader.result as any).buffer));
                  }
                  reader.readAsBinaryString(value);
                 
                });
              }
            });

        }),
      Canvas: HTMLCanvasElement,
      Image: HTMLImageElement,
      ImageData: ImageData,
      Video: HTMLVideoElement,
      createCanvasElement: () => document.createElement("canvas"),
      createImageElement: () => document.createElement("img")
    });

    Promise.all([

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(filePathRoot),
      await faceapi.nets.faceLandmark68Net.loadFromDisk(filePathRoot),
      await faceapi.nets.faceRecognitionNet.loadFromDisk(filePathRoot),
      await faceapi.nets.faceExpressionNet.loadFromDisk(filePathRoot)
    ]).then(() => {
      this.messages.push("FIN");
    }).catch( (error:any)=>{
      this.messages.push("error");
    });
    

  }

  loader2() {

  }

}
