const video = document.getElementById('webcam');
const predictionEl = document.getElementById('prediction');

async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}
startWebcam();

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

const labels = ["Hello", "Thank You", "Yes", "No", "I Love You"];
let lastPrediction = "";

let model;
async function loadModel() {
  try {
    model = await tf.loadLayersModel('model/model.json');
    console.log("Model loaded!");
  } catch {
    console.warn("No model found — using random predictions.");
  }
}
loadModel();

hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0].flatMap(lm => [lm.x, lm.y, lm.z]);
    let predictionText;
    if (model) {
      const input = tf.tensor([landmarks]);
      const prediction = model.predict(input);
      const labelIndex = prediction.argMax(1).dataSync()[0];
      predictionText = labels[labelIndex] || "Unknown";
    } else {
      if (Math.random() > 0.9) {
        predictionText = labels[Math.floor(Math.random() * labels.length)];
      } else {
        predictionText = lastPrediction || "...";
      }
    }
    lastPrediction = predictionText;
    predictionEl.textContent = predictionText;
  }
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 480,
  height: 360,
});
camera.start();