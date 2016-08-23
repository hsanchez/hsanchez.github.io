// Copyright Huascar Sanchez, 2014.
/**
 * @author Huascar A. Sanchez
 */
$(function () {

  var VERSION = "1";
  if (window.localStorage.ss_version !== VERSION) {
    delete window.localStorage.answers;
    delete window.localStorage.ss_page;
    delete window.localStorage.query;
    window.localStorage.ss_version = VERSION;
  }

  //https://github.com/coolaj86/knuth-shuffle
  //OR http://en.wikipedia.org/wiki/Fisher-Yates_shuffle
  function shuffle(array) {
    var currentIndex = array.length
      , temporaryValue
      , randomIndex
      ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function parseArray(array) {
    if (!array) {
      return [];
    }

    return JSON.parse(array);
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }
	
	function product(args) {
	    if(!args.length)
	        return [[]];
	    var prod = product(args.slice(1)), r = [];
	    args[0].forEach(function(x) {
	        prod.forEach(function(p) {
	            r.push([x].concat(p));
	        });
	    });
	    return r;
	}	
	
	// Compute the edit distance between the two given strings
	function editDistance(a, b) {
	  if (a.length === 0) return b.length; 
	  if (b.length === 0) return a.length; 

	  var matrix = [];

	  // increment along the first column of each row
	  var i;
	  for (i = 0; i <= b.length; i++) {
	    matrix[i] = [i];
	  }

	  // increment each column in the first row
	  var j;
	  for (j = 0; j <= a.length; j++) {
	    matrix[0][j] = j;
	  }

	  // Fill in the rest of the matrix
	  for (i = 1; i <= b.length; i++) {
	    for (j = 1; j <= a.length; j++) {
	      if (b.charAt(i-1) == a.charAt(j-1)) {
	        matrix[i][j] = matrix[i-1][j-1];
	      } else {
	        matrix[i][j] = Math.min(
						matrix[i-1][j-1] + 1, 			 // substitution
	          Math.min(matrix[i][j-1] + 1, // insertion
	          matrix[i-1][j] + 1)); 			 // deletion
	      }
	    }
	  }

	  return matrix[b.length][a.length];
	};	
	
	function normalizedEditDistance(a, b){
		var ed  = editDistance(a, b)/1.0;
		var len = Math.max(a.length, b.length)/1.0;
		
		return (ed/len);
	};
	
	function distance(a, b){
		return 1.0 - normalizedEditDistance(a, b);
	}

  function isBlock(code) {
    if(!code) return false;

    var $code = $(code);

    // if it's less than 25 lines of code, we don't treat it as a suitable
    // code block
    var text      = $code.text();

    var matches = text.match(/\{([^}]+)\}/g) || [];
    if(matches.length > 1) {
      console.log("+1");
    }

    var splitText = text.split('\n');
    var loc = splitText.length;

    if (loc < 5) return false;

    var result = JavaDetector.guessLanguage($code);
    var lang = result.language;

    console.log(lang);
    return JavaDetector.isLanguageSupported(lang);

  }
	
  function toString(codes) {
    var blocks = [];

    codes = codes || [];

    for (var idx = 0; idx < codes.length; idx++) {
      var code = codes[idx];
			blocks.push($(code).text());
    }

    return blocks;
  }

  function validBlocks(codes) {
    var blocks = [];

    codes = codes || [];

    for (var idx = 0; idx < codes.length; idx++) {
      var code = codes[idx];
      if (isBlock($(code))) {
        blocks.push(code);
      }
    }

    return blocks;
  }

  function isEmpty(blocks){
    return (blocks === undefined || blocks.length == 0)
  }


  // Setup the main controller
  var Searcher = {
    page: window.localStorage.ss_page || 1,
    item: 0,
    answers: parseArray(window.localStorage.answers),
    candidates: [],
    api: 'http://api.stackexchange.com/2.2/',
    stop: false,

    reset: function () {
      Searcher.item = 0;
      $('#output').val('');
      $('#logger').empty().append($('<div>', {
        class: 'oc',
        text: 'search console'
      }));
      $('#displayer').empty().append($('<div>', {
        class: 'oc',
        text: 'selection console'
      }));
      $('#search').attr('disabled', false).text('SEARCH');
			$("input").prop('disabled', false);
      $('.done').hide();
    },

    logger: function (text, class_suffix, to_append) {
      var $div = $('<div>', {
        'html': text,
        'class': 'log-' + class_suffix
      });

      //noinspection JSJQueryEfficiency
      $('#logger').append($div);

      if (to_append) {
        $div.append(to_append);
      }

      //noinspection JSJQueryEfficiency
      $('#logger')[0].scrollTop = $('#logger')[0].scrollHeight;
    },

    displayer: function (text, class_suffix, to_append) {
      var $div = $('<div>', {
        'html': text,
        'class': 'disp-' + class_suffix
      });

      //noinspection JSJQueryEfficiency
      $('#displayer').append($div);

      if (to_append) {
        $div.append(to_append);
      }

      //noinspection JSJQueryEfficiency
      $('#displayer')[0].scrollTop = $('#displayer')[0].scrollHeight;
    },

    listCandidate: function (message) {
      if (message) {
        Searcher.displayer(message, "item");
      }
    },

    logError: function (reason) {
      if (reason) {
        Searcher.logger(reason, "error");
      }

      Searcher.item++;
      Searcher.search();
    },

    nextAnswer: function (message) {
      if (message) {
        Searcher.logger(message, "success");
      }

      Searcher.item++;
      Searcher.search();
    },
		
		typicality: function(){
			
			Searcher.displayer("Sorting code examples by typicality.", "info");
			
      // Output!
      setTimeout(function () {
				var candidates = [];
				if (Searcher.candidates.length == 0){
					candidates = parseArray(window.localStorage.cached).items;
				} else {
					candidates = Searcher.candidates;
				}
				
				var k 	= $("#topk").val();
        var len = k ? k : candidates.length;

        var entries = [];

        var candidateArray = candidates;        
				
				// Get all entries
				var idx;
				for (idx = 0; idx < len; idx++) {
          var answerObject 	= candidateArray[idx];
          var answer_id 		= answerObject.answer_id;
					var answer_score 	= answerObject.score;
          var link 					= answerObject.link ? answerObject.link : answerObject.href;
					var code					= answerObject.code;
					
          var entry = {
            "title": answerObject.title
            , "href": link
            , 'target': '_blank'
						, "code": code
						, "answer_id": answer_id
          };

          entries.push(entry);
        }
				
				// Initialize their scores
				var T = new Hashtable();
				
				for (idx = 0; idx < entries.length; idx++) {
					var e = entries[idx];
					T.put(e, 0.0);
				}
				
				// Compute each entry's typicality score
				var array = [];
				array.push(entries);
				array.push(entries);
				var cartesian = product(array);
				
				for(idx = 0; idx < cartesian.length; idx++){
					var pair = cartesian[idx];
					
					var si = pair[0];
					var sj = pair[1];
					
					var w = distance(si.code, sj.code);
					
					var Tsi = T.get(si) + w;
					var Tsj = T.get(sj) + w;
					
					T.put(si, Tsi);
					T.put(sj, Tsj);
				}
				
				// Sorts entries on their typicality score				
				var sortable = [];
				for(idx = 0; idx < T.keys().length; idx++){
					var entry = T.keys()[idx];
					sortable.push([entry, T.get(entry)]);	
				}
				// for (var entry in T){
				// 	sortable.push([entry, T[entry]]);
				// }
				
				sortable.sort(function(a, b){
					return b[1] - a[1];
				});
				
				
				for(idx = 0; idx < sortable.length; idx++){
					var s = sortable[idx][0];
					
          var answer_id 		= s.answer_id;
					var answer_score 	= s.score;
          var link 					= s.link ? s.link : s.href;
					var code					= s.code;
					
          Searcher.displayer("Code example ", "trying", $('<a>', {
            'text': answer_id,
            'href': link,
            'target': '_blank'
          }));
          
					Searcher.listCandidate("Code example candidate");
				}
				
        $('#search').attr('disabled', false).text('Search Again');
				$("input").prop('disabled', false);
        Searcher.wait(false);
        Searcher.item++;
        setTimeout(function () {
          $('.done').fadeIn();
        }, 400);

      }, 230); // Don't freeze up the browser
		},
		
		foundCandidates: function(){
      Searcher.logger("Found enough suitable code snippets", "success");

      Searcher.displayer("Fetching code examples", "trying");
      Searcher.displayer("Downloading code examples, ready to try.", "info");
		},

    fetchCandidates: function (lengthAsBound) {			

      // Output!
      setTimeout(function () {
				var k = $("#topk").val();
				
				var candidates = [];
				if (Searcher.candidates.length == 0){
					candidates = parseArray(window.localStorage.cached).items;
				} else {
					candidates = Searcher.candidates;
				}
				
				
        var len = lengthAsBound ? candidates.length : k;

        var cached = [];

        var shuffledArray = candidates;

        for (var idx = 0; idx < len; idx++) {
          var answerObject 	= shuffledArray[idx];
          var answer_id 		= answerObject.answer_id;
					var answer_score 	= answerObject.score;
          var link 					= answerObject.link ? answerObject.link : answerObject.href;
					var code					= answerObject.code;
					
          Searcher.displayer("Code example ", "trying", $('<a>', {
            'text': answer_id,
            'href': link,
            'target': '_blank'
          }));

          var entry = {
            "title": answerObject.title
            , "href": link
            , 'target': '_blank'
						, "code": code
						, "answer_id": answer_id
          };

          cached.push(entry);

          Searcher.listCandidate("Code example candidate");
        }

        var cachedCandidates = {
          "items": cached
        };

        window.localStorage.setItem("cached", JSON.stringify(cachedCandidates));

        $('#search').attr('disabled', false).text('Search Again');
				$("input").prop('disabled', false);
        Searcher.wait(false);
        Searcher.item++;
        setTimeout(function () {
          $('.done').fadeIn();
        }, 400);

        Searcher.candidates = []; // clear array

      }, 230); // Don't freeze up the browser
    },

    nextPage: function () {
      if (parseInt(Searcher.page) >= 7) {
        Searcher.logger("Out of answers from StackOverflow!", "out");
        $('#search').attr('disabled', false).text('Start Again');
        Searcher.wait(false);
        return false;
      }

      Searcher.logger("Fetching page " + Searcher.page + "...", "trying");
			
			var query = $("#query").val();

      var common_url = '&pagesize=100&order=desc&site=stackoverflow&todate=1471910400';
      var question_url = Searcher.api + 'similar?sort=relevance&accepted=True&notice=False&tagged=java&title=' + query + '&page=' + Searcher.page + common_url;

      var titles = {};

      $.getJSON(question_url, function (data_questions) {
        var answer_ids = [];
        $.each(data_questions['items'], function (k, v) {
          if (v.accepted_answer_id) {
            answer_ids.push(v.accepted_answer_id);
            titles[v.question_id] = v.title;
          }
        });

        var answer_url = Searcher.api + 'answers/' + answer_ids.join(';') + '?sort=activity&filter=!9hnGsyXaB' + common_url;

        $.getJSON(answer_url, function (data_answers) {
          Searcher.logger("Answers downloading, ready to check.", "success");
          $.each(data_answers['items'], function (k, v) {
            Searcher.answers.push({
              'answer_id': v.answer_id,
              'question_id': v.question_id,
              'link': 'http://stackoverflow.com/questions/' + v.question_id + '/#' + v.answer_id,
              'body': v.body,
              'score': v.score,
              'title': titles[v.question_id] || ""
            });
          });

          // Save the new answers
          window.localStorage.answers = JSON.stringify(Searcher.answers);

          Searcher.page = parseInt(Searcher.page, 10) + 1;
          window.localStorage.ss_page = Searcher.page;

          Searcher.search();
        });
      });
    },

    search: function () {
      if (Searcher.stop) {
        Searcher.logger("Stopped by user", "out");
        $('#search').attr('disabled', false).text('Search Again');
				$("input").prop('disabled', false);
        Searcher.wait(false);
        Searcher.stop = false;
        Searcher.reset();
        return false;
      }

      Searcher.stop = false;

      if (Searcher.item >= Searcher.answers.length) {
        Searcher.nextPage();
        return false;
      }

      $('.done').hide();

      Searcher.wait(true);

      // Output!
      setTimeout(function () {
        var answer_id = Searcher.answers[Searcher.item].answer_id;
        var link = Searcher.answers[Searcher.item].link;

        Searcher.logger("Checking code example ", "trying", $('<a>', {
          'text': answer_id,
          'href': link,
          'target': '_blank'
        }));
				
        Searcher.examineAnswer();

      }, 230); // Don't freeze up the browser
    },

    examineAnswer: function () {
      var answer = Searcher.answers[Searcher.item].body;
      var codes = answer.match(/<code>(.|[\n\r])*?<\/code>/g);

      var blocks = validBlocks(codes);
      if(!isEmpty(blocks)){
        if (Searcher.candidates.length >= 20) { // arbitrary number
					Searcher.foundCandidates();
          Searcher.fetchCandidates(false);
        } else {
					var item 	= Searcher.answers[Searcher.item];
					item.code = toString(blocks).join("\n");
          Searcher.candidates.push(item);
          Searcher.nextAnswer("Found a valid code example");
        }
      } else { // no valid code found
        Searcher.logError("Invalid Java code example");
      }

    },

    wait: function (state) {
      $('.sad-waiter').css({
        height: state ? 137 : 0
      }).find('.hour, .minute').css({
        display: state ? 'block' : 'none'
      });
      $('#stopper').toggleClass('hide', !state);
    },

    setupConsoles: function () {
      $('#logger').empty().append($('<div>', {
        class: 'oc',
        text: 'search console'
      }));
      $('#displayer').empty().append($('<div>', {
        class: 'oc',
        text: 'selection console'
      }));
    }
  };

  Searcher.wait(false);
  Searcher.setupConsoles();

  $('#search').click(function () {
		
		var query = $("#query").val();
		
		if(!query){
			alert("Please provide a query");
			$("#query").focus();
			
      return false;
		}
		
		if(!window.localStorage.query){
			window.localStorage.query = query;
		} else {
			if(window.localStorage.query !== query){
		    delete window.localStorage.answers;
		    delete window.localStorage.ss_page;
		    delete window.localStorage.query;
		    window.localStorage.ss_version = VERSION;
			}		
		}
		
    // Disclaimer
    // TODO: Use better modal?
    var warn = "Ready for fetching arbitrary Java code examples from StackOverflow?";
    var ready = window.localStorage.ss_confirmed || confirm(warn);
    
		if (!ready) {
      return false;
    }
		
    window.localStorage.ss_confirmed = true;

    Searcher.reset();

    $('#search').attr('disabled', true).text('Searching...');
		$("input").prop('disabled', true);
    $('#logger').find('.oc').remove();
    $('#displayer').find('.oc').remove();
    Searcher.stop = false;

    Searcher.search();
  });

  $('#stop').click(function () {
    Searcher.stop = true;
    return false;
  });
	
	var checkboxes = $("input[type=checkbox]"); 
		checkboxArray = Array.from( checkboxes );

	function confirmCheck() {
		$('#displayer').empty();
  	if (this.checked) {
    	Searcher.typicality();
  	} else {
  		Searcher.fetchCandidates(false);
  	}
	}

	checkboxArray.forEach(function(checkbox) {
  	checkbox.addEventListener('change', confirmCheck);
	});

});
