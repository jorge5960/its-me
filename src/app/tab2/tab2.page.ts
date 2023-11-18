import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PhotoService } from '../services/photo.service';
import * as faceapi from 'face-api.js';
import { Photo } from '@capacitor/camera';
import { Platform } from '@ionic/angular';
import { File } from '@ionic-native/file';

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
  message: string = null;

  constructor(public photoService: PhotoService,private file:File) { }

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


  async ngOnInit() {
    this.loadModels();
  }

  async loadModels(){
    // set path to load models
    let filePathRoot = this.file.applicationDirectory + 'www/assets/models/';

    // faceapi settings
    faceapi.env.monkeyPatch({
      readFile: filePath =>
        new Promise(resolve => {
          let fileExtension = filePath.split("?")[0].split(".").pop();
          let fileName = filePath.split("?")[0].split("/").pop();

          this.file.resolveLocalFilesystemUrl(filePathRoot + fileName).then((res:any) => {
            if (res.isFile){
                if (fileExtension === "json") {
                  this.file.readAsText(filePathRoot, fileName).then((text:any) => {
                    resolve(text);
                  });
                } else {
                  this.file.readAsArrayBuffer(filePathRoot, fileName).then((arrayBuffer:any) => {
                    resolve(new Uint8Array(arrayBuffer));
                  });
                }
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

    return Promise.all([faceapi.nets.ssdMobilenetv1.loadFromDisk(filePathRoot),
    faceapi.nets.faceLandmark68Net.loadFromDisk(filePathRoot),
    faceapi.nets.faceRecognitionNet.loadFromDisk(filePathRoot),
    faceapi.nets.faceExpressionNet.loadFromDisk(filePathRoot)]).then(() => { }).catch((error: any) => {
     return true;
    });

  }
  
}
