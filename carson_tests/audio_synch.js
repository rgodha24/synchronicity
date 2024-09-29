//Acceleromter initialization
var sampleFreq = 60;

let accel = null;
try {
  accel = new Accelerometer({ referenceFrame: "device", frequency: sampleFreq});
  accel.addEventListener("error", (event) => {
    // Handle runtime errors.
    if (event.error.name === "NotAllowedError") {
      // Branch to code for requesting permission.
    } else if (event.error.name === "NotReadableError") {
      console.log("Cannot connect to the sensor.");
    }
  });

  accel.addEventListener("reading", () => {
    console.log(`Acceleration along the X-axis ${accel.x}`);
    console.log(`Acceleration along the Y-axis ${accel.y}`);
    console.log(`Acceleration along the Z-axis ${accel.z}`);
    updateBuffer(accel)
  });
  
  accel.start();
} catch (error) {
  // Handle construction errors.
  if (error.name === "SecurityError") {
    // See the note above about permissions policy.
    console.log("Sensor construction was blocked by a permissions policy.");
  } else if (error.name === "ReferenceError") {
    console.log("Sensor is not supported by the User Agent.");
  } else {
    throw error;
  }
}

//FFT analysis

//Buffer time in seconds
var bufferTime = 5;
//Number of acceleration samples in buffer
var bufferSize = bufferTime*sampleFreq;
//Buffer for acceleration data
var buffer = [];
//How often fft analysis is conducted
var fftRate = 5;
//Countdown to fft analysis
var fftCount = 1;
//Dominant frequency
var domFreq = 1;

function argMax(data) {
    max = data[0];
    loc = 0;
    for (i = 1; i < data.length; i++) {
        if (data[i] > max) {
            max = data[i];
            loc = i;
        }
    }

    return i;
}

function fftAnalysis(data, sampleRate) {
    var fft = require('fft-js').fft,
    fftUtil = require('fft-js').util,
    signal = data;

    var phasors= fft(signal);

    var frequencies = fftUtil.fftFreq(phasors, sampleRate),
    magnitudes = fftUtil.fftMag(phasors); 

    var both = frequencies.map(function (f, ix) {
        return {frequency: f, magnitude: magnitudes[ix]};
    });

    console.log(both);

    domFreq = frequencies[argMax(magnitudes)];
    console.log(domFreq);
}

function updateBuffer(accel) {
    //Removes value at beginning of buffer if at max length
    if (buffer.length == bufferSize) {
        buffer.shift();
    }
    //Adds newest acceleration magnitude data to the end of the buffer
    buffer.push(Math.sqrt(Math.pow(accel.x, 2) + Math.pow(accel.y, 2) + Math.pow(accel.z, 2)));
    //Checks to see if fft analysis can be performed
    fftCount--;
    if (buffer.length == bufferSize && fftCount == 0) {
        fftAnalysis(buffer, sampleFreq)

        //Resets fft countdown
        fftCount = fftRate;
    }
}

//Audio player
const audioContext = new AudioContext();

//Passes audio element to context
const audioElement = document.getElementById("audio");

const track = audioContext.createMediaElementSource(audioElement);

// Play/pause functionality
const playButton = document.getElementById("button");

playButton.addEventListener(
  "click",
  () => {
    // Check if context is in suspended state (autoplay policy)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Play or pause track depending on state
    if (playButton.dataset.playing === "false") {
      audioElement.play();
      playButton.dataset.playing = "true";
    } else if (playButton.dataset.playing === "true") {
      audioElement.pause();
      playButton.dataset.playing = "false";
    }
  },
  false,
);

// Resets when track ends
audioElement.addEventListener(
    "ended",
    () => {
      playButton.dataset.playing = "false";
    },
    false,
  );

// Adds speed control functionality
const bufferNode = audioContext.createBufferSource();

track.connect(audioContext.destination);

