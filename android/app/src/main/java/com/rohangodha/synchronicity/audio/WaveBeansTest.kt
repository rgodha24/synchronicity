package com.rohangodha.synchronicity.audio

import io.wavebeans.execution.*
import io.wavebeans.lib.io.*
import io.wavebeans.lib.stream.*
import java.io.File


fun main() {
    // describe what you want compute
    val out = 440.sine()
        .trim(1000)
        .toMono16bitWav("file://" + File("sine440.wav").absoluteFile)
    // this code launches it in single threaded mode,
    // follow execution documentation for details
    SingleThreadedOverseer(listOf(out)).use { overseer ->
        val results = overseer.eval(44100.0f).map { it.get() }
        if (!results.all { it.finished }) {
            results.mapNotNull { it.exception }
                .forEach { it.printStackTrace(System.err) }
        }
    }
}