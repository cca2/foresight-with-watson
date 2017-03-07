// The Api module is designed to handle all interactions with the server

// Initialize Firebase
var config = {
  apiKey: "AIzaSyBCGbp0y4MFxbn6Shglj93T7yFNWdjyzNA",
  authDomain: "foresight-2d795.firebaseapp.com",
  databaseURL: "https://foresight-2d795.firebaseio.com",
  storageBucket: "foresight-2d795.appspot.com",
  messagingSenderId: "1046780498990"
};
firebase.initializeApp(config);

var database = firebase.database();

var Api = (function() {
  var requestPayload;
  var responsePayload;
  var signalData = {"output": ''};
  var messageEndpoint = '/api/message';
  var extractSignalDataEndpoint = '/api/signal_data'
  var translateEndPoint =  'api/translate'

  // Publicly accessible methods defined
  return {
    extractSignalData: extractSignalData,
    sendRequest: sendRequest,
    translateSignal: translate,


    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    },
    getSignalData: function() {
      return signalData;
    },
    setSignalData: function(newSearchWordsStr) {
      signalData = JSON.parse(newSearchWordsStr);
      responsePayload.context['signal'] = signalData;
    },
    updateDescriptionInPortuguese: function(description) {
      responsePayload.context.signal.description_pt = description;
    },
    collectSignal: function(source, title, soWhat, searchTerms, description, media_link) {
      var newSignalKey = database.ref().child('Signals').push().key;
      // signal.key = newSignalKey;
      var updates = {};
      updates['/Signals/' + newSignalKey] = {'title': title, 'source': source, 'soWhat':soWhat, 'keywords':searchTerms, 'description':description, 'media_link':media_link};
      return database.ref().update(updates);
    }
  };

  function translate(payload, respFunc) {
    var signalData = {'title': payload.context.signal.title_en, 'description': payload.context.signal.proposedDescription};
    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', translateEndPoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        respFunc(http.responseText);
      }
    };

    var params = JSON.stringify(signalData);
    http.send(params);
  }

  //Extract concepts from a signal URL
  function extractSignalData(url, context) {
    var payloadToWatson = {};
    if (url) {
      payloadToWatson.url = url;
    }
    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', extractSignalDataEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setSignalData(http.responseText);
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    // if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
    //   Api.setRequestPayload(params);
    // }

    // Send request
    http.send(params);
  }

  // Send a message request to the server
  function sendRequest(text, context) {
    // Build request payload
    var payloadToWatson = {};
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    if (context) {
      payloadToWatson.context = context;
    }

    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText);
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params);
    }

    // Send request
    http.send(params);
  }
}());
