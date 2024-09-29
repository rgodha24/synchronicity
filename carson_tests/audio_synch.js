//Acceleromter initialization

// Request permission for iOS 13+ devices
if (DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
    DeviceMotionEvent.requestPermission();
}

window.addEventListener("devicemotion", handleMotion);

var sampleFreq = 1;

function handleMotion(event) {
    //Updates acceleration data buffer
    updateBuffer(event.acceleration);

    //Updates sample frequency
    sampleFreq = 1000./event.interval
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
//Song tempo (beats per second)
var tempo = 1;
//Tempo offset (how much music tempo should be offset from motion tempo)
var tempoOffset = 0;

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

    var domFreq = frequencies[argMax(magnitudes)];
    console.log(domFreq);
    return domFreq;
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
        var domFreq = fftAnalysis(buffer, sampleFreq)

        //Resets fft countdown
        fftCount = fftRate;

        //Sets music playback rate based on tempo and motion resonance
        audioElement.playbackRate = findClosestResonance(tempo, domFreq+tempoOffset)
    }
}

function findClosestResonance(tempo, target) {
    const resonanceRange = [1/3, 1/2, 1, 2, 3];
    const ratio = target/tempo;
    
    function score(resonance) {
        return Math.abs(1-ratio*resonance);
    }
    var closest = score(resonanceRange[0]);
    var loc = 0;
    for (i = 0; i < resonanceRange.length; i++) {
        if (score(resonanceRange[i]) < closest) {
            closest = score(resonanceRange[i]);
            loc = i;
        }
    }

    var final = ratio*resonanceRange[loc];
    if (final < 0.5) {
        final = 0.5;
    } else if (final > 2) {
        final = 2;
    }
    return final;
}

//Gets audio element
const audioElement = document.getElementById("audio");

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