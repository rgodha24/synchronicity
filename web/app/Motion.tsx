// Requeimport React, { useEffect, useState } from 'react';
import { useEffect, useRef, useState } from "react";
import fftJS from "fft-js";
const { fft, util: fftUtil } = fftJS;

interface Acceleration {
  x: number;
  y: number;
  z: number;
}

const buffer = new Array(128).fill(0).map((_) => 0);

const Motion = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    // Request permission for iOS 13+ devices
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      (DeviceMotionEvent as any).requestPermission();
    }

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      if (e.acceleration) {
        const accel = e.acceleration;
        const magnitude =
          Math.pow(accel.x || 0, 2) +
          Math.pow(accel.y || 0, 2) +
          Math.pow(accel.z || 0, 2);

        buffer.shift();
        buffer.push(magnitude);
      }
    };

    const interval = setInterval(() => {
      const phasors = fft(buffer);
      const frequencies: any[] = fftUtil.fftFreq(phasors, 62.5); // Sample rate and coef is just used for length, and frequency step
      const magnitudes = fftUtil.fftMag(phasors);

      const both = frequencies.map(function (f: number, ix: number) {
        return { frequency: f, magnitude: magnitudes[ix] };
      });

      both.sort(({ magnitude: a }, { magnitude: b }) => b - a);

      const domFreak = both[1].frequency / 2;

      const res = findClosestResonance(124, domFreak * 60);
      audioRef.current!.playbackRate = res;
    }, 100);

    window.addEventListener("devicemotion", handleDeviceMotion);

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h2>Accelerometer FFT</h2>
      <p>Buffer Size: {buffer.length}</p>
      <audio src="/clown.mp3" ref={audioRef} />
      <button
        className="p-8 bg-black text-white"
        onClick={() => audioRef.current?.play()}
      >
        play
      </button>
    </div>
  );
};

function findClosestResonance(tempo: number, target: number) {
  const resonanceRange = [1 / 3, 1 / 2, 1, 2, 3];
  const ratio = target / tempo;

  function score(resonance: number) {
    return Math.abs(1 - ratio * resonance);
  }
  var closest = score(resonanceRange[0]);
  var loc = 0;
  for (let i = 0; i < resonanceRange.length; i++) {
    if (score(resonanceRange[i]) < closest) {
      closest = score(resonanceRange[i]);
      loc = i;
    }
  }

  var final = ratio * resonanceRange[loc];
  if (final < 0.5) {
    final = 0.5;
  } else if (final > 2) {
    final = 2;
  }
  return final;
}

export default Motion;
