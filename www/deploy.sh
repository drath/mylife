#!/bin/bash
echo "Copying app icon"
cp res/icon.png ../platforms/android/res/drawable-hdpi

echo "Cleaning, building, deploying..."
../platforms/android/cordova/clean
../platforms/android/cordova/build
../platforms/android/cordova/run
