// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.jetbrains.kotlin.android) apply false
    kotlin("jvm") version "1.9.0"
}

dependencies {
    implementation("io.wavebeans:exe:0.3.1")
    implementation("io.wavebeans:lib:0.3.1")
}