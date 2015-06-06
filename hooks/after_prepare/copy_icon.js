#!/usr/bin/env node
var fs = require("fs");

console.log("Inside AFTER_PREPARE");

fs.createReadStream("www/res/icon/android/mipmap-mdpi/icon.png").pipe(fs.createWriteStream("platforms/android/res/drawable-mdpi/icon.png"));
fs.createReadStream("www/res/icon/android/mipmap-hdpi/icon.png").pipe(fs.createWriteStream("platforms/android/res/drawable-hdpi/icon.png"));
fs.createReadStream("www/res/icon/android/mipmap-xhdpi/icon.png").pipe(fs.createWriteStream("platforms/android/res/drawable-xhdpi/icon.png"));
fs.createReadStream("www/res/icon/android/mipmap-xxhdpi/icon.png").pipe(fs.createWriteStream("platforms/android/res/drawable-xxhdpi/icon.png"));
