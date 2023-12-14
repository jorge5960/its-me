import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Photo } from '@capacitor/camera';
import { Platform } from '@ionic/angular';
import * as faceapi from 'face-api.js';
import { PhotoService } from '../services/photo.service';
var Buffer = require('buffer/').Buffer;
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {


  @ViewChild('imageCanvas1', { static: false }) canvas1: ElementRef;
  @ViewChild('img1', { static: false }) img1: ElementRef;
  imgSrc1: string = '';
  @ViewChild('imageCanvas2', { static: false }) canvas2: ElementRef;
  @ViewChild('img2', { static: false }) img2: ElementRef;
  imgSrc2: string = '';
  @ViewChild('imageCanvas3', { static: false }) canvas3: ElementRef;
  @ViewChild('img3', { static: false }) img3: ElementRef;
  imgSrc3: string = '';
  imgSrcWin: string = '';
  distancia1:any = 0;
  distancia2:any = 0;

  @ViewChild(Platform, { static: false }) content: Platform;
  private ctx: CanvasRenderingContext2D;

  messages: string[] = [];
  constructor(public photoService: PhotoService, private cdr:ChangeDetectorRef) { }

  onImageLoad1($event: any) {

  }
  onImageLoad2($event: any) {

  }
  onImageLoad3($event: any) {

  }

  addFoto1() {
    this.photoService.addNewToGallery().then((photo: Photo) => {
      this.imgSrc1 = photo.webPath;


    });
  }

  addFoto2() {
    this.photoService.addNewToGallery().then((photo: Photo) => {
      this.imgSrc2 = photo.webPath;


    });
  }

  addFoto3() {
    this.photoService.addNewToGallery().then((photo: Photo) => {
      this.imgSrc3 = photo.webPath;


    });
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
                response.json().then((value: any) => {
                  this.messages.push('reading json fin ');
                  resolve(Buffer.from(JSON.stringify(value)));
                });
              } else {
                this.messages.push('response reading blob ');

                //response.arrayBuffer
                response.blob().then((value: any) => {
                  this.messages.push('BLOB INICIO ');

                  let reader = new FileReader();
                  reader.onload = () => {
                    // this.messages.push('leidos '+(reader.result as ArrayBuffer).byteLength);
                  }
                  reader.onloadend = () => {
                    // this.messages.push('leidos fin '+(reader.result as ArrayBuffer).byteLength);
                    resolve(new Uint8Array(reader.result as any) as Buffer);
                    //resolve(Buffer.from(value,'base64'));
                  }
                  reader.readAsArrayBuffer(value);

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
      await faceapi.nets.faceExpressionNet.loadFromDisk(filePathRoot),
      await faceapi.nets.tinyFaceDetector.loadFromDisk(filePathRoot)
    ]).then(() => {
      this.messages.push("FIN");
    }).catch((error: any) => {
      this.messages.push("error");
    });


  }

  async comparar() {


    // detect a single face from the ID card image
    const foto1 = await faceapi.detectSingleFace(this.img1.nativeElement)
      .withFaceLandmarks().withFaceDescriptor();

    // detect a single face from the selfie image
    const foto2 = await faceapi.detectSingleFace(this.img2.nativeElement)
      .withFaceLandmarks().withFaceDescriptor();

    // detect a single face from the selfie image
    const foto3 = await faceapi.detectSingleFace(this.img3.nativeElement)
      .withFaceLandmarks().withFaceDescriptor();

      if(foto1 && foto2 && foto3){
        // Using Euclidean distance to comapare face descriptions
        this.distancia1 = faceapi.euclideanDistance(foto1.descriptor, foto3.descriptor);
        this.distancia2 = faceapi.euclideanDistance(foto2.descriptor, foto3.descriptor);
        if(this.distancia1 > this.distancia2){
          this.imgSrcWin = this.imgSrc2;
        }else{
          this.imgSrcWin = this.imgSrc1;
        }
      }else{

        this.messages.push(" No detectadas caras ");

      }
      this.cdr.markForCheck();

  }
}
