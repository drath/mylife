#!/bin/bash
echo "Copying app icon"
cp res/icon.png ../platforms/android/res/drawable-hdpi

echo "Cleaning, building, deploying..."
phonegap run android
