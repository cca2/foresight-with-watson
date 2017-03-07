// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var ConversationPanel = (function() {
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromWatson: '.from-watson',
      latest: '.latest'
    },
    authorTypes: {
      user: 'user',
      watson: 'watson'
    }
  };

  // Publicly accessible methods defined
  return {
    init: init,
    inputKeyDown: inputKeyDown
  };

  // Initialize the module
  function init() {
    chatUpdateSetup();
    // Api.sendRequest( '', null );
    Api.sendRequest('', {});
    setupInputBox();
  }
  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function(newPayloadStr) {
      currentRequestPayloadSetter.call(Api, newPayloadStr);
      var payload = JSON.parse(newPayloadStr);
      displayMessage(payload, settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;

    Api.setResponsePayload = function(newPayloadStr) {
      currentResponsePayloadSetter.call(Api, newPayloadStr);
      // var payload = JSON.parse(newPayloadStr);      
      var payload = Api.getResponsePayload();

      var action = payload.context.action;
      var signal = {'key': ''};

      if (action === 'save_signal') {
        payload.context.action = 'none';
        var source = payload.context.signal.source_link;
        var title = payload.context.signal.title_pt;
        var soWhat = payload.context.signal.so_what;
        var description = payload.context.signal.proposedDescription_pt;
        var keywords = payload.context.signal.keywords;
        var media_link = payload.context.signal.media_link;
        var signalId = Api.collectSignal(source, title, soWhat, keywords, description, media_link).then(function() {
          payload.output.text = ['Parabéns, você está com mais um sinal na sua coleção! Até a próxima.']
          displayMessage(payload, settings.authorTypes.watson);
        })
      }else if (action === 'extract_search_words') {
        var signal_source_link = payload.input.text;
        var sourceLinkPos = signal_source_link.indexOf(payload.context.webProtocol);
        signal_source_link = signal_source_link.substring(sourceLinkPos).split(' ')[0];
        payload.context.action = 'none';
        Api.extractSearchWords(signal_source_link);
        displayMessage(payload, settings.authorTypes.watson);
      }else if (action == 'extract_signal_data') {
        var signal_source_link = payload.input.text;
        var sourceLinkPos = signal_source_link.indexOf(payload.context.webProtocol);
        signal_source_link = signal_source_link.substring(sourceLinkPos).split(' ')[0];
        // payload.context.signal.signal_source_link = signal_source_link;
        payload.context.action = 'select_descriptions';
        currentResponsePayloadSetter.call(Api, JSON.stringify(payload));        
        Api.extractSignalData(signal_source_link);
        displayMessage(payload, settings.authorTypes.watson);        
      }else if (action == 'select_descriptions') {
        var entities = payload.entities;
        var optionsList = [];
        var currentSignalData = Api.getResponsePayload().context.signal;
        for (var i = 0; i < entities.length; i++) {
          var entity = entities[i];
          if (entity.entity === 'option') {
            var value = 0;
            if (entity.value === 'zero') {
              value = 0;
            }else if (entity.value === 'first') {
              value = 1;
            }else if (entity.value === 'second') {
              value = 2;
            }else if (entity.value === 'third') {
              value = 3;
            }else if (entity.value === 'fourth') {
              value = 4;
            }else if (entity.value === 'fifth') {
              value = 5;
            }else if (entity.value === 'sixth') {
              value = 6;
            }else if (entity.value === 'seventh') {
              value = 7;
            }else if (entity.value === 'eighth') {
              value = 8;
            }else if (entity.value === 'nineth') {
              value = 9;
            }else if (entity.value === 'tenth') {
              value = 10;
            }else if (entity.value === 'eleventh') {
              value = 11;
            }else if (entity.value === 'twelfth') {
              value = 12;
            }else if (entity.value === 'thirteenth') {
              value = 13;
            }else if (entity.value === 'fourteeth') {
              value = 14;
            }else if (entity.value === 'fifteenth') {
              value = 15;
            }else if (entity.value === 'sixteenth') {
              value = 16;
            }else if (entity.value === 'seventeenth') {
              value = 17;
            }
            optionsList.push(value);
          }
        }
        currentSignalData.selectedDescriptions = optionsList;
        var proposedDescription = '';
        for (var i = 0; i < optionsList.length; i++) {
          proposedDescription += currentSignalData.descriptionPhrases[optionsList[i]];
        }
        currentSignalData.proposedDescription = proposedDescription;
        payload.context.signal.proposedDescription = proposedDescription;
        payload.context.action = 'none';
        currentResponsePayloadSetter.call(Api, JSON.stringify(payload));
        var payload = Api.getResponsePayload();
        displaySignal(payload);
        payload.context.action = 'none';
        payload.output.text = ['Espera só um pouco que vou traduzir o sinal para o português!'];
        displayMessage(payload, settings.authorTypes.watson);

        //Traduz as informações do sinal para português
        Api.translateSignal(payload, function(response) {
          var translation = JSON.parse(response);
          payload.context.signal.title_pt = translation.title_pt;
          payload.context.signal.proposedDescription_pt = translation.description_pt;
          displaySignal(payload, 'pt-br');
          payload.output.text = ['Nem sempre minha tradução fica legal e você deve revisá-la. Dá uma olhada tanto no título quanto na descrição do sinal e corrige eventuais besteiras que escrevi :).'];
          displayMessage(payload, settings.authorTypes.watson);
          displayMessage(payload, settings.authorTypes.watson, {'text':'revisei a tradução', 
            function() {
              console.log('>>> 10 <<<');
            }
          });          
        })
      }else if (action === 'translate_signal') {
        var payload = Api.getResponsePayload();
        payload.context.action = 'none';
        Api.translateSignal(payload, function(response) {
          var translation = JSON.parse(response);
          payload.context.signal.title_pt = translation.title_pt;
          payload.context.signal.proposedDescription_pt = translation.description_pt;
          displaySignal(payload, 'pt-br');
          payload.output.text = ['Nem sempre minha tradução fica legal. Você pode editar tanto o título quando a descrição do sinal. Quando estiver tudo OK me avisa.'];
          displayMessage(payload, settings.authorTypes.watson);
        })
      }else if (action === 'update_so_what') {
        var payload = Api.getResponsePayload();
        payload.context.signal.so_what = payload.context.signal.change_relevance + ' ' + payload.context.signal.inspiration;
        displaySignal(payload, 'pt-br');
        displayMessage(payload, settings.authorTypes.watson);
      }
      // displayMessage(payload, settings.authorTypes.watson);      
    };

    var currentSignalDataSetter = Api.setSignalData;
    Api.setSignalData = function(newPayloadStr) {
      // currentSignalDataSetter.call(Api, newPayloadStr);
      var payload = JSON.parse(newPayloadStr);
      var responsePayload = Api.getResponsePayload();
      responsePayload.context.signal = payload;

      displaySignal(responsePayload);
      // payload['output'] = {'text': []};
      // payload.output.text.push('Título: ' + payload.title_pt);
      responsePayload.output.text = [];
      responsePayload.output.text.push('Extraí algumas frases que podem ser combinadas para descrever o que é o sinal. Dá um scroll e lê elas até o final.');
      // for (var i = 0; i < responsePayload.context.signal.descriptionPhrases.length; i++) {
      //   responsePayload.output.text.push('frase ' + i + ': ' + responsePayload.context.signal.descriptionPhrases[i]);
      // }

      responsePayload.output.text.push('Escolhe uma sequencia das ' + responsePayload.context.signal.descriptionPhrases.length + ' sentenças acima para compor a descrição do sinal (Ex: 1, 3 e 5)')
      // if (payload.titlePortuguese) {
      //   payload.output.text.push('Título (Português): ' + payload.titlePortuguese);
      // }
      // var tempRelations = [];
      // var numDescriptions = 0;
      // for (var i = 0; i < payload.relations.length; i++) {
      //   var tempRelation = payload.relations[i].sentence;
      //   var includeRelationInTheList = true;
      //   for (var j = 0; j < tempRelations.length; j++) {
      //     if (tempRelations[j] === tempRelation)
      //       includeRelationInTheList = false
      //   }
      //   if (includeRelationInTheList) {
      //     tempRelations.push(payload.relations[i].sentence);
      //     payload.output.text.push('Descrição ' + (numDescriptions) + ': ' + payload.relations[i].sentence);
      //     numDescriptions++;
      //   }
      // }    
      // var keywords = payload.keywords;
      // var keywordsStr = 'Palavras chaves: ' + keywords[0].text;

      // for (var i = 1; i < keywords.length; i++) {
      //   keywordsStr += ', ' + keywords[i].text
      // }

      // keywordsStr += ', ' + payload.keywordsPortuguese;

      // payload.output.text.push(keywordsStr);
      displayMessage(responsePayload, settings.authorTypes.watson);      
      displaySignalSentenceOptions(responsePayload);
    };

  }

// Set up the input box to underline text as it is typed
  // This is done by creating a hidden dummy version of the input box that
  // is used to determine what the width of the input text should be.
  // This value is then used to set the new width of the visible input box.
  function setupInputBox() {
    var input = document.getElementById('textInput');
    var dummy = document.getElementById('textInputDummy');
    var minFontSize = 14;
    var maxFontSize = 16;
    var minPadding = 4;
    var maxPadding = 6;

    // If no dummy input box exists, create one
    if (dummy === null) {
      var dummyJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': 'textInputDummy'
        }]
      };

      dummy = Common.buildDomElement(dummyJson);
      document.body.appendChild(dummy);
    }

    function adjustInput() {
      if (input.value === '') {
        // If the input box is empty, remove the underline
        input.classList.remove('underline');
        input.setAttribute('style', 'width:' + '100%');
        input.style.width = '100%';
      } else {
        // otherwise, adjust the dummy text to match, and then set the width of
        // the visible input box to match it (thus extending the underline)
        input.classList.add('underline');
        var txtNode = document.createTextNode(input.value);
        ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
          'text-transform', 'letter-spacing'].forEach(function(index) {
            dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
          });
        dummy.textContent = txtNode.textContent;

        var padding = 0;
        var htmlElem = document.getElementsByTagName('html')[0];
        var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
        if (currentFontSize) {
          padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize)
            * (maxPadding - minPadding) + minPadding);
        } else {
          padding = maxPadding;
        }

        var widthValue = ( dummy.offsetWidth + padding) + 'px';
        input.setAttribute('style', 'width:' + widthValue);
        input.style.width = widthValue;
      }
    }

    // Any time the input changes, or the window resizes, adjust the size of the input box
    input.addEventListener('input', adjustInput);
    window.addEventListener('resize', adjustInput);

    // Trigger the input event once to set up the input box and dummy element
    Common.fireEvent(input, 'input');
  }

  function displaySignalSketch(payload, language='en') {
    var signal = payload.context.signal;

    var titleP = document.getElementById('proposed-title');
    titleP.innerText = (language == 'en') ? payload.context.signal.title_en:payload.context.signal.title_pt;

    var descriptionP = document.getElementById('proposed-description');
    descriptionP.innerText = (language == 'en') ? payload.context.signal.proposedDescription:payload.context.signal.proposedDescription_pt;

    // var chatBoxElement = document.querySelector(settings.selectors.chatBox);
    // messageArray = [];

    // if (signal.media_link && signal.media_link != '') {
    //   var messageJson = {
    //     'tagName': 'div',
    //     'classNames': ['segments'],
    //     'children': [{
    //       'tagName': 'div',
    //       'classNames': ['from-watson', 'signal-sketch'],
    //       'children': [{
    //         'tagName': 'div',
    //         'classNames': ['message-inner'],
    //         'children': [{
    //           'tagName': 'img',
    //           'attributes': [{
    //             'name':'src',
    //             'value': signal.media_link
    //           }]
    //         }]
    //       }]
    //     }]
    //   }
    //   messageArray.push(Common.buildDomElement(messageJson));
    // }

    // var messageJson = {
    //   'tagName': 'div',
    //   'classNames': ['segments'],
    //   'children': [{
    //     'tagName': 'div',
    //     'classNames': ['from-watson', 'signal-sketch', 'signal-sketch-title'],
    //     'children': [{
    //       'tagName': 'div',
    //       'classNames': ['message-inner'],
    //       'children': [{
    //         'tagName': 'p',
    //         'attributes': [{
    //           'name':'contenteditable',
    //           'value': 'true',
    //         }, {
    //           'name': 'onkeyup',
    //           'value': 'updateTitle(this.innerText)'
    //         }],
    //         'text': (language == 'en') ? signal.title_en:signal.title_pt
    //       },
    //       {
    //         'tagName': 'label',
    //         'text': 'Título sugerido'
    //       }]
    //     }]
    //   }]
    // }
    // messageArray.push(Common.buildDomElement(messageJson));

    // if (signal.proposedDescription && signal.proposedDescription != '') {
    //   var messageJson = {
    //     'tagName': 'div',
    //     'classNames': ['segments'],
    //     'children': [{
    //       'tagName': 'div',
    //       'classNames': ['from-watson', 'signal-sketch', 'description'],
    //       'children': [{
    //         'tagName': 'div',
    //         'classNames': ['message-inner'],
    //         'children': [{
    //           'tagName': 'p',
    //           'attributes': [{
    //             'name':'contenteditable',
    //             'value': 'true'
    //           }],
    //           'text': (language == 'en') ? signal.proposedDescription:signal.proposedDescription_pt,
    //           'children': [{
    //             'tagName': 'label',
    //             'text': 'Descrição do sinal'
    //           }]
    //         }]
    //       }]
    //     }]
    //   }
    //   messageArray.push(Common.buildDomElement(messageJson));
    // }

    // if (signal.so_what && signal.so_what != '') {
    //   var messageJson = {
    //     'tagName': 'div',
    //     'classNames': ['segments'],
    //     'children': [{
    //       'tagName': 'div',
    //       'classNames': ['from-watson', 'signal-sketch'],
    //       'children': [{
    //         'tagName': 'div',
    //         'classNames': ['message-inner'],
    //         'children': [{
    //           'tagName': 'p',
    //           'attributes': [{
    //             'name':'contenteditable',
    //             'value': 'true'
    //           }],
    //           'text': signal.so_what,
    //           'children': [{
    //             'tagName': 'label',
    //             'text': 'E daí'
    //           }]
    //         }]
    //       }]
    //     }]
    //   }
    //   messageArray.push(Common.buildDomElement(messageJson));
    // }

    // messageArray.forEach(function(currentDiv) {
    //   chatBoxElement.appendChild(currentDiv);
    //   // Class to start fade in animation
    //   currentDiv.classList.add('load');
    // });
    // // Move chat to the most recent messages when new messages are added
    // scrollToChatBottom();
  }

  function displaySignalSentenceOptions(payload) {
    var signal = payload.context.signal;

    var chatBoxElement = document.querySelector(settings.selectors.chatBox);
    messageArray = [];

    for (var i = 0; i < payload.context.signal.descriptionPhrases.length; i++) {
      // responsePayload.output.text.push('frase ' + i + ': ' + responsePayload.context.signal.descriptionPhrases[i]);
      var messageJson = {
        'tagName': 'div',
        'classNames': ['segments'],
        'children': [{
          'tagName': 'div',
          'classNames': ['from-watson', 'signal-sketch', 'sentence-option'],
          'children': [{
            'tagName': 'div',
            'classNames': ['message-inner'],
            'children': [{
              'tagName': 'p',
              'attributes': [{
                'name':'contenteditable',
                'value': 'true'
              }],
              'text': payload.context.signal.descriptionPhrases[i],
              'children': [{
                'tagName': 'label',
                'text': 'frase ' + i
              }]
            }]
          }]
        }]
      }
      messageArray.push(Common.buildDomElement(messageJson));
    }


    messageArray.forEach(function(currentDiv) {
      chatBoxElement.appendChild(currentDiv);
      // Class to start fade in animation
      currentDiv.classList.add('load');
    });
    // Move chat to the most recent messages when new messages are added
    scrollToChatBottom();
  }

  // Display a user or Watson message that has just been sent/received
  function displayMessage(newPayload, typeValue, isContinueButton = null) {
    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text)
      || (newPayload.output && newPayload.output.text);
    if (isUser !== null && textExists) {
      // Create new message DOM element
      var messageDivs = [];
      if (!isContinueButton) {
        messageDivs = buildMessageDomElements(newPayload, isUser);
      }else {
        messageDivs = buildContinueButtonDomElements(continueButton.text, function() {          
        })
      }
      var chatBoxElement = document.querySelector(settings.selectors.chatBox);
      var previousLatest = chatBoxElement.querySelectorAll((isUser
              ? settings.selectors.fromUser : settings.selectors.fromWatson)
              + settings.selectors.latest);
      // Previous "latest" message is no longer the most recent
      if (previousLatest) {
        Common.listForEach(previousLatest, function(element) {
          element.classList.remove('latest');
        });
      }

      messageDivs.forEach(function(currentDiv) {
        chatBoxElement.appendChild(currentDiv);
        // Class to start fade in animation
        currentDiv.classList.add('load');
      });
      // Move chat to the most recent messages when new messages are added
      scrollToChatBottom();
    }
  }

  // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
  // Returns true if user, false if Watson, and null if neither
  // Used to keep track of whether a message was from the user or Watson
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.watson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElements(newPayload, isUser) {
    var textArray = isUser ? newPayload.input.text : newPayload.output.text;
    if (Object.prototype.toString.call( textArray ) !== '[object Array]') {
      textArray = [textArray];
    }
    var messageArray = [];

    textArray.forEach(function(currentText) {
      if (currentText) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                // <p>{messageText}</p>
                'tagName': 'p',
                'text': currentText
              }]
            }]
          }]
        };
        messageArray.push(Common.buildDomElement(messageJson));
      }
    });

    return messageArray;
  }

  function buildContinueButtonDomElements(text, functionClick) {
    var messageArray = [];
    var buttonJson = {
      // <div class='segments'>
      'tagName': 'div',
      'classNames': ['segments'],
      'children': [{
        // <div class='from-user/from-watson latest'>
        'tagName': 'div',
        'classNames': ['from-watson', 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
        'children': [{
          // <div class='message-inner'>
          'tagName': 'button',
          'classNames': ['continue-dialog-button'],
          'text': text
        }]
      }]      
    }
    messageArray.push(Common.buildDomElement(buttonJson));
    return messageArray;
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from Watson.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the Watson message is long.
  function scrollToChatBottom() {
    var scrollingChat = document.querySelector('#scrollingChat');

    // Scroll to the latest message sent by the user
    var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser
            + settings.selectors.latest);
    if (scrollEl) {
      scrollingChat.scrollTop = scrollEl.offsetTop;
    }
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      // Retrieve the context from the previous server response
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest(inputBox.value, context);

      // Clear input box for further messages
      inputBox.value = '';
      Common.fireEvent(inputBox, 'input');
    }
  }
}());
