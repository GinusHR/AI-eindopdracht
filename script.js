import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";

const enableWebcamButton = document.getElementById("webcamButton");
const logButton = document.getElementById("logButton");

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusDiv = document.getElementById("status");
const memeSound = document.getElementById("meme");
const memeImage = document.getElementById("funny");

const drawUtils = new DrawingUtils(canvasCtx);
let handLandmarker = undefined;
let webcamRunning = false;
let results = undefined;

let nn;

function createNeuralNetwork() {
  ml5.setBackend("webgl");
  nn = ml5.neuralNetwork({ task: "classification", debug: true });

  const options = {
    model: "model2/model.json",
    metadata: "model2/model_meta.json",
    weights: "model2/model.weights.bin",
  };

  nn.load(options, createHandLandmarker);
  console.log(nn);
}

/********************************************************************
// CREATE THE POSE DETECTOR
********************************************************************/
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
  console.log("model loaded, you can start webcam");

  enableWebcamButton.addEventListener("click", (e) => enableCam(e));
  logButton.addEventListener("click", (e) => classifyHand(e));
};

/********************************************************************
// START THE WEBCAM
********************************************************************/
async function enableCam() {
  webcamRunning = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    video.srcObject = stream;
    video.addEventListener("loadeddata", () => {
      canvasElement.style.width = video.videoWidth;
      canvasElement.style.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      document.querySelector(".videoView").style.height =
        video.videoHeight + "px";
      predictWebcam();
    });
  } catch (error) {
    console.error("Error accessing webcam:", error);
  }
}

/********************************************************************
// START PREDICTIONS    
********************************************************************/
async function predictWebcam() {
  results = await handLandmarker.detectForVideo(video, performance.now());

  let hand = results.landmarks[0];

  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  for (let hand of results.landmarks) {
    drawUtils.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 5,
    });
    drawUtils.drawLandmarks(hand, {
      radius: 4,
      color: "#FF0000",
      lineWidth: 2,
    });
  }

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function classifyHand() {
  console.log(results.landmarks[0]);
  let numbersonly = [];
  let hand = results.landmarks[0];
  for (let point of hand) {
    numbersonly.push(point.x, point.y, point.z);
  }

  nn.classify(numbersonly, (results) => {
    console.log(`I think this pose is a ${results[0].label}`);
    console.log(`I am ${results[0].confidence.toFixed(2) * 100}% sure`);

    statusDiv.innerText = `I think this pose is a ${results[0].label}. I am ${
      results[0].confidence.toFixed(2) * 100
    }% sure`;
    if (results[0].label === "gun") {
      memeSound.src = "sounds/come-as-u-are.mp3";
    } else if (results[0].label === "A") {
      memeSound.src = "sounds/rickroll-but-short.mp3";
    } else if (results[0].label === "heart") {
      memeSound.src = "sounds/flashbanggg.mp3";
    } else if (results[0].label === "four") {
      memeSound.src = "sounds/if-we-being-real-yeat.mp3";
    }

    if (results[0].label === "gun") {
      memeImage.src = "images/kurt.jpeg";
    } else if (results[0].label === "A") {
      memeImage.src = "images/rick.jpeg";
    } else if (results[0].label === "heart") {
      memeImage.src = "images/conquesting.jpeg";
    } else if (results[0].label === "four") {
      memeImage.src = "images/fantastic.jpeg";
    }
  });
}

/********************************************************************
// LOG HAND COORDINATES IN THE CONSOLE
********************************************************************/
function logAllHands() {
  for (let hand of results.landmarks) {
    // console.log(hand)
    console.log(hand[4]);
  }
}

/********************************************************************
// START THE APP
********************************************************************/
if (navigator.mediaDevices?.getUserMedia) {
  createNeuralNetwork();
}
