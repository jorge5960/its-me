import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Photo } from '@capacitor/camera';
import { Platform } from '@ionic/angular';
import * as faceapi from 'face-api.js';
import { PhotoService } from '../services/photo.service';

var Buffer = require('buffer/').Buffer;
@Component({
  selector: 'app-Video',
  templateUrl: 'video.page.html',
  styleUrls: ['video.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VideoPage implements OnInit, OnDestroy {


  @ViewChild('videoContainer', { static: false }) videoContainer: ElementRef;
  @ViewChild('video', { static: false }) video: ElementRef;
  @ViewChild(Platform, { static: false }) content: Platform;
  private ctx: CanvasRenderingContext2D;
  imgSrc: string = '';
  messages: string[] = [];

  constructor(public photoService: PhotoService) { }
  ngOnDestroy(): void {
    this.video.nativeElement.src = '';
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery().then((photo: Photo) => {
      this.imgSrc = photo.webPath;


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
      await faceapi.nets.ageGenderNet.loadFromDisk(filePathRoot),
    ]).then(() => {
      this.messages.push("FIN");
      this.addEvents();
      this.playVideo();
    }).catch((error: any) => {
      this.messages.push("error");
    });


  }

  playVideo() {
    if (!navigator.mediaDevices) {
      console.error("mediaDevices not supported");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 360, ideal: 720, max: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        this.video.nativeElement.srcObject = stream;
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  addEvents() {


    this.video.nativeElement.addEventListener("play", async () => {
      this.log("The video is starting to play.");
      this.log("Loading the faces from the database");
      //const labeledFaceDescriptors = await loadLabeledFaceDescriptors();
      this.log("All faces have been loaded");
     // const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
      // Creating the canvas
      const canvas:any = faceapi.createCanvasFromMedia(this.video.nativeElement);

      // This will force the use of a software (instead of hardware accelerated)
      // Enable only for low configurations
      canvas.willReadFrequently = true;

      this.videoContainer.nativeElement.appendChild(canvas);

      // Resizing the canvas to cover the video element
      const canvasSize = { width: this.video.nativeElement.width, height: this.video.nativeElement.height };
      faceapi.matchDimensions(canvas, this.video.nativeElement);
      this.log("Done.");
      setInterval(async () => {
       
        let detections = await faceapi
          .detectAllFaces(this.video.nativeElement)
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions()
          .withAgeAndGender();

        // Set detections size to the canvas size
        const detectionsArray = faceapi.resizeResults(detections, canvasSize);
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

       // this.detectionsDraw(canvas, [], detectionsArray);

       // faceapi.matchDimensions(canvas, this.video.nativeElement);
       // detections = faceapi.resizeResults(detections, this.video.nativeElement);
        faceapi.draw.drawDetections(canvas, detectionsArray);
        faceapi.draw.drawFaceLandmarks(canvas, detectionsArray);
        faceapi.draw.drawFaceExpressions(canvas, detectionsArray);
        detectionsArray.forEach( (detection:any) => {
          const box = detection.detection.box
          const drawBox = new faceapi.draw.DrawBox(box, { label: Math.round(detection.age) + " year old " + detection.gender })
          drawBox.draw(canvas)
        })

      }, 500);
    });

  }

  // Drawing our detections above the video
detectionsDraw(canvas:any, faceMatcher:any, DetectionsArray:any) {
  DetectionsArray.forEach((detection:any) => {
    const faceMatches = faceMatcher.findBestMatch(detection.descriptor);
    const box = detection.detection.box;
    const drawOptions = {
      label: faceMatches.label,
      lineWidth: 2,
      boxColor: "#FF0015",
    };
    const drawBox = new faceapi.draw.DrawBox(box, drawOptions);
    drawBox.draw(canvas);
  });
}
log(msg:any) {
  this.messages.push(msg);
 /* const message = document.createTextNode(msg);
  const li = document.createElement("li");
  li.appendChild(message);
  logs.appendChild(li);
  // Scroll down
  logs.scrollTop = logs.scrollHeight;*/
}

}
