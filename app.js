/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');
var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');

//Page image extractor
// var Scraper = require('image-scraper');
// var scraper = new Scraper('');

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());


var language_translator = new LanguageTranslatorV2({
  url: "https://gateway.watsonplatform.net/language-translator/api",
  username: "5fbe2300-02a4-45be-92d8-90ae11db1f7b",
  password: "Cp8KefigEe74",
  version: 'v2'
});

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  // username: 'cca2@cin.ufpe.br',
  // password: 'Pessoal#19',
  url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2016-10-21',
  version: 'v1'
});

// Create Alchemy service wrapper
var alchemy_language = new AlchemyLanguageV1({
  api_key: '7971ffc280520cff900c21b63de49c3014db2b37'
});

app.post('/api/translate', function(req, res) {

  var signalData = {};
  var promise = new Promise(function(resolve, reject) {
    language_translator.translate({
      text: req.body.title,
      source: 'en',
      target: 'pt-br'
    }, function(err, translation) {
      if (err)
        console.log(err)
      else {
        var translation = translation.translations[0].translation;
        // return res.json({'translation':translation});
        signalData.title_pt = translation;
        resolve(translation);
      }
    })        
  })

  promise.then(function(translation) {
    language_translator.translate({
      text: req.body.description,
      source: 'en',
      target: 'pt-br'
    }, function(err, translation) {
      if (err)
        console.log(err)
      else {
        var translation = translation.translations[0].translation;
        // return res.json({'translation':translation});
        signalData.description_pt = translation;
        return res.json(signalData);
      }
    })        
  })
})

// Endpoint to be called from the client side
app.post('/api/signal_data', function(req, res) {
  var parameters = {
    extract: 'title, relations, entities, keywords',
    sentiment: 1,
    // maxRetrieve: 30,
    url: req.body.url
  };

  //Extracting images from the page
  // scraper.address = parameters.url;
  // scraper.scrape(function(image) { 
    // var img = new Image();
    // img.onload = function() {
    //   if (this.height > 200) {
    //     console.log(image.address)
    //   }
    // }

    // img.url = image.address;
  // });  

    // scraper.on('image', function(image) {
    //   console.log(image.address);
    // })

  alchemy_language.combined(parameters, function (err, response) {

    if (err)
      console.log('error:', err);
    else {

      // var res = {};
      // res['title'] = response.title.text;
      // res['sugested_description'] = response.relations[0].text;

      // console.log(JSON.stringify(response, null, 2));
      var promise = new Promise(function(resolve, reject) {
        //Translating the title to portuguese
        var title = response.title;
        var signalData = {
          'source_link': req.body.url,
          'title_en': response.title,
          'title_pt': '',
          'descriptionPhrases': [],
          'selectedDescriptions':[],
          'keywords': [],
          'concepts': response.concepts,
          'output': {'text':''},
          'proposedDescription': '',
          'media_link': ''
        }

        for (var i = 0; i < response.keywords.length; i++) {
          signalData.keywords.push(response.keywords[i].text);

        }

        var tempRelations = [];
        var numDescriptions = 0;
        for (var i = 0; i < response.relations.length; i++) {
          var tempRelation = response.relations[i].sentence;
          var includeRelationInTheList = true;
          for (var j = 0; j < tempRelations.length; j++) {
            if (tempRelations[j] === tempRelation) {
              includeRelationInTheList = false;
              break;
            }
          }
          if (includeRelationInTheList) {
            tempRelations.push(tempRelation)
            signalData.descriptionPhrases.push(response.relations[i].sentence);
          }
        }    

        language_translator.translate({
          text: title,
          source: 'en',
          target: 'pt-br'
        }, function(err, translation) {
          if (err)
            console.log(err)
          else {
            var titlePt = translation.translations[0].translation;
            signalData.title_pt = titlePt;
            return res.json(signalData);
          }
        })        
      });

      promise.then(function(response) {
        var keywords = response.keywords;
        var keywordsString = '';
        if (keywords.length > 0) {
          keywordsString += keywords[0].text.toLowerCase();
          for (var i = 1; i < keywords.length; i++) {
            keywordsString += ', ' + keywords[i].text.toLowerCase();
          }
          language_translator.translate({
              text: keywordsString,
              source: 'en',
              target: 'pt-br'
            }, function(err, translation) {
              if (err)
                console.log(err)
              else {
                // console.log(keywordsString + ', ' + translation.translations[0].translation);

                signalData['keywords_pt'] = translation.translations[0].translation;
                console.log('>>> 20 <<<')
                return res.json(response);
              }
          });        
        } 
      })
    }
  });

  // var parameters = {
  //   url: req.body.url,
  //   knowledgeGraph: 1
  // };

  // alchemy_language.concepts(parameters, function (err, response) {
  //   if (err)
  //     console.log('error:', err);
  //   else {
  //     console.log(JSON.stringify(response, null, 2));
  //     var concepts = response.concepts;
  //     var conceptsString = '';
  //     if (concepts.length > 0) {
  //       conceptsString += concepts[0].text.toLowerCase();
  //       for (var i = 1; i < concepts.length; i++) {
  //         conceptsString += ', ' + concepts[i].text.toLowerCase();
  //       }
  //       language_translator.translate({
  //           text: conceptsString,
  //           source: 'en',
  //           target: 'pt-br'
  //         }, function(err, translation) {
  //           if (err)
  //             console.log(err)
  //           else {
  //             console.log(conceptsString + ', ' + translation.translations[0].translation);
  //           }
  //       });        
  //     }
  //   }
  // });

})

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';

  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }

  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

module.exports = app;
