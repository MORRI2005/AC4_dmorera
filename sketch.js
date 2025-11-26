let mic, fft, amp;
let nArms = 10;
let subLines = 12;
let steps = 400;
let baseRotation = 0;

let startButton, stopButton;
let micEnabled = false;

function setup() {
  createCanvas(1200, 900);
  angleMode(DEGREES);
  colorMode(HSB, 360, 100, 100, 100);
  frameRate(30);

  mic = new p5.AudioIn();

  fft = new p5.FFT(0.8, 512);
  amp = new p5.Amplitude();

  startButton = createButton("Iniciar Micro");
  startButton.position(20, 20);
  startButton.mousePressed(startMic);

  stopButton = createButton("Detener Micro");
  stopButton.position(140, 20);
  stopButton.mousePressed(stopMic);
}

function startMic() {
  let context = getAudioContext();
  if (context.state !== "running") {
    context.resume();
  }

  mic.start(() => {
    fft.setInput(mic);
    amp.setInput(mic);
    micEnabled = true;
  });
}

function stopMic() {
  mic.stop();
  micEnabled = false;
}

function draw() {
  background(0, 0, 0, 30);
  push();
  translate(width / 2 - 150, height / 2);

  let rawVolume = micEnabled ? amp.getLevel() : 0;
  let volume = constrain(rawVolume * 3.5, 0, 1);

  let spectrum = micEnabled ? fft.analyze() : new Array(512).fill(0);

  let ampScale = map(volume, 0, 1, 0.8, 3);

  let bass = micEnabled ? fft.getEnergy("bass") : 0;
  let lowMid = micEnabled ? fft.getEnergy("lowMid") : 0;
  let mid = micEnabled ? fft.getEnergy("mid") : 0;
  let humanEnergy = (bass + lowMid + mid) / 3;

  baseRotation += map(humanEnergy, 0, 255, 0, 2);

  for (let arm = 0; arm < nArms; arm++) {
    let baseAngle = arm * (360 / nArms) + baseRotation;
    drawPetal(
      baseAngle,
      subLines,
      steps,
      arm,
      ampScale,
      spectrum,
      humanEnergy,
      volume
    );
  }

  pop();
  drawAudioVisualizer(volume, spectrum, humanEnergy);
}

function drawPetal(
  baseAngle,
  subLines,
  steps,
  arm,
  ampScale,
  spectrum,
  humanEnergy,
  volume
) {
  for (let s = 0; s < subLines; s++) {
    let offsetIndex = map(s, 0, subLines - 1, -1, 1);
    let angle = baseAngle;
    let radius = 35 * ampScale;

    let maxRadius = map(volume, 0, 1, 470, 1200);

    beginShape();
    for (let i = 0; i < steps; i++) {
      let widen =
        sin(i * 0.22) * 120 * ampScale * map(humanEnergy, 0, 255, 0.5, 2);
      let sideShift = offsetIndex * widen;

      let x = (radius + sideShift) * cos(angle);
      let y = (radius + sideShift) * sin(angle);
      vertex(x, y);

      radius *= 1.0065 + map(volume, 0, 1, 0, 0.003);
      let freqIndex = floor(map(s, 0, subLines - 1, 0, spectrum.length - 1));
      angle += map(spectrum[freqIndex], 0, 255, 0.28, 0.3);

      if (radius > maxRadius) break;
    }

    let freqIndex = floor(map(s, 0, subLines - 1, 0, spectrum.length - 1));
    let baseHue = map(spectrum[freqIndex], 0, 255, 0, 360);
    let boost = map(humanEnergy, 0, 255, 0, 120);
    let hue = (baseHue + boost) % 360;

    stroke(hue, 100, 100, 80);
    strokeWeight(0.8);
    noFill();
    endShape();
  }
}

function drawAudioVisualizer(volume, spectrum, humanEnergy) {
  let sideX = width - 250;
  let sideY = 50;
  let w = 200;
  let h = height - 100;

  noStroke();
  fill(20);
  rect(sideX, sideY, w, h, 10);

  stroke(200, 100, 100);
  noFill();
  beginShape();
  for (let i = 0; i < spectrum.length; i += 8) {
    let x = map(i, 0, spectrum.length - 1, sideX + 80, sideX + w - 10);
    let y = map(spectrum[i], 0, 255, sideY + h, sideY);
    vertex(x, y);
  }
  endShape();

  noStroke();
  fill(255);
  text("Espectro", sideX + 80, sideY + 20);
}
