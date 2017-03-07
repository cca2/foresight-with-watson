// The PayloadPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true, PayloadPanel: true*/

  function displaySignal(payload, language='en') {
    var signal = payload.context.signal;
    
    var signalImageAndTitle = document.getElementById('signal-image-and-title');
    
    var img = document.getElementById('signal-media');
    var imgHeight = img.height;

    if (signal.media_link && signal.media_link != '') {
      img.setAttribute('src', signal.media_link);
    }
    
    signalImageAndTitle.style.height = imgHeight + 'px';

    var titleP = document.getElementById('proposed-title');
    titleP.innerText = (language == 'en') ? payload.context.signal.title_en:payload.context.signal.title_pt;

    var descriptionP = document.getElementById('proposed-description');
    descriptionP.innerText = (language == 'en') ? payload.context.signal.proposedDescription:payload.context.signal.proposedDescription_pt;

    var img     

    var soWhatP = document.getElementById('proposed-so-what');
    soWhatP.innerText = (language == 'en') ? payload.context.signal.so_what:payload.context.signal.so_what;
  }

