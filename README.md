# My Life

My Life is a journal to keep track of your thoughts as you go through the ups and downs of life, itself. 
Every night, it will ask a simple question: "How was your day?". It will also show something you wrote a a week ago, 
a month ago, a year ago... 

That's it. A simple journal for your life. 

Your memories are completely private and reside on the phone *only*. They are meant for your eyes. 
This is the opposite of Facebook. In time, more features will be added, such as adding voice messages, 
or attaching pictures of the moment. 

But for now, enjoy (My) Life.

# Technical details

## Network activity
- On startup, the app sends the registration ID and timezone info to the MyLife server using AJAX POST.
- During backup and restore. The filetransfer.js upload/download functions are used to communicate with the server.


This is a pretty simple (at least for now!) hybrid app using Phonegap technology. It also uses Google Cloud 
Notifications alongwith a mylife nodejs-based server application for daily reminders. (TBD: Post link to mylife 
server.) Registration IDs that are sent to the app from GCN are sent to the mylife server programmatically, using
$.post

The entries are stored in a websql database. 

# Trivia
PS: Inspired by the now defunct [OhLife](http://ohlife.com/index.php) project.

# License
[MIT](http://opensource.org/licenses/MIT)
