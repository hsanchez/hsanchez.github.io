$(function() {
    // todo(Huascar) implement an algorithm for translating keywords into Java code

    var VERSION = "1";
    if(window.localStorage.ss_version !== VERSION) {
        delete window.localStorage.answers;
        delete window.localStorage.ss_page;
        delete window.localStorage.candidates;
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
        if(!array) {
            return [];
        }

        return JSON.parse(array);
    }

    if(!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    // Setup the main controller
    var Searcher = {
        page: window.localStorage.ss_page || 1,
        item: 0,
        answers:  parseArray(window.localStorage.answers),
        candidates: [],
        api: 'http://api.stackexchange.com/2.1/',
        stop: false,

        reset: function() {
            Searcher.item = 0;
            $('#output').val('');
            $('#logger').empty().append($('<div>', {class: 'oc', text: 'search console'}));
            $('#displayer').empty().append($('<div>', {class: 'oc', text: 'selection console'}));
            $('#search').attr('disabled', false).text('START');
            $('.done').hide();
        },

        logger: function(text, class_suffix, to_append) {
            var $div = $('<div>', {
                'html': text,
                'class': 'log-' + class_suffix
            });

            $('#logger').append($div);

            if(to_append) {
                $div.append(to_append);
            }

            $('#logger')[0].scrollTop = $('#logger')[0].scrollHeight;
        },

        displayer: function(text, class_suffix, to_append) {
            var $div = $('<div>', {
                'html': text,
                'class': 'disp-' + class_suffix
            });

            $('#displayer').append($div);

            if(to_append) {
                $div.append(to_append);
            }

            $('#displayer')[0].scrollTop = $('#displayer')[0].scrollHeight;
        },

        listCandidate: function(message){
            if(message) {
                Searcher.displayer(message, "item");
            }
        },

        logError: function(reason) {
            if(reason) {
                Searcher.logger(reason, "error");
            }

            Searcher.item++;
            Searcher.search();
        },

        nextAnswer: function(message){
            if(message) {
                Searcher.logger(message, "success");
            }

            Searcher.item++;
            Searcher.search();
        },

        fetchCandidates: function(lengthAsBound){
            Searcher.logger("Found enough suitable code snippets", "success");

            Searcher.displayer("Fetching candidates", "trying");
            Searcher.displayer("Candidates downloading, ready to try.", "info");

            // Output!
            setTimeout(function() {

                var len = lengthAsBound ? Searcher.candidates.length : 5;

                var shuffledArray = shuffle(Searcher.candidates);
                for(var idx = 0; idx < len; idx++){
                    var answerObject    = shuffledArray[idx];
                    var answer_id       = answerObject.answer_id;
                    var link            = answerObject.link;

                    Searcher.displayer("Try StackOverflow answer ", "trying", $('<a>', {'text': answer_id, 'href': link, 'target': '_blank'}));
                    Searcher.listCandidate("Source code curation candidate");
                }



                $('#search').attr('disabled', false).text('Search Again');
                Searcher.wait(false);
                Searcher.item++;
                setTimeout(function() {
                    $('.done').fadeIn();
                }, 400);

                Searcher.candidates = []; // clear array

            }, 230); // Don't freeze up the browser
        },

        nextPage: function() {
            if(parseInt(Searcher.page) >= 7) {
                Searcher.logger("Out of answers from StackOverflow!", "out");
                $('#search').attr('disabled', false).text('Start Again');
                Searcher.wait(false);
                return false;
            }

            Searcher.logger("Fetching page " + Searcher.page + "...", "trying");

            var common_url = '&pagesize=100&order=desc&site=stackoverflow&todate=1406505600';
            var question_url = Searcher.api + 'questions?sort=activity&tagged=sort;java&page=' + Searcher.page + common_url;

            $.getJSON(question_url, function(data_questions) {
                var answer_ids = [];
                $.each(data_questions['items'], function(k, v) {
                    if(v.accepted_answer_id) {
                        answer_ids.push(v.accepted_answer_id);
                    }
                });

                var answer_url = Searcher.api + 'answers/' + answer_ids.join(';') + '?sort=activity&filter=!9hnGsyXaB' + common_url;

                $.getJSON(answer_url, function(data_answers) {
                    Searcher.logger("Answers downloading, ready to check.", "success");
                    $.each(data_answers['items'], function(k, v){
                        Searcher.answers.push({
                            'answer_id': v.answer_id,
                            'question_id': v.question_id,
                            'link': 'http://stackoverflow.com/questions/'+v.question_id+'/#' + v.answer_id,
                            'body': v.body,
                            'score': v.score
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

        search: function() {
            if(Searcher.stop) {
                Searcher.logger("Stopped by user", "out");
                $('#search').attr('disabled', false).text('Search Again');
                Searcher.wait(false);
                Searcher.stop = false;
                Searcher.reset();
                return false;
            }

            Searcher.stop = false;

            if(Searcher.item >= Searcher.answers.length) {
                Searcher.nextPage();
                return false;
            }

            $('.done').hide();

            Searcher.wait(true);

            // Output!
            setTimeout(function() {
                var answer_id = Searcher.answers[Searcher.item].answer_id;
                var link = Searcher.answers[Searcher.item].link;

                Searcher.logger("Checking StackOverflow answer ", "trying", $('<a>', {'text': answer_id, 'href': link, 'target': '_blank'}));
                Searcher.examineAnswer();

            }, 230); // Don't freeze up the browser
        },

        examineAnswer: function() {
            var answer = Searcher.answers[Searcher.item].body;
            var answer_id = Searcher.answers[Searcher.item].answer_id;
            var question_id = Searcher.answers[Searcher.item].question_id;
            var link =  Searcher.answers[Searcher.item].link;
            var codes = answer.match(/<code>(.|[\n\r])*?<\/code>/g);
            // todo(Huascar) think how to use this score
            var score = Searcher.answers[Searcher.item].score;

            console.log(score);

            if(!codes) {
                Searcher.logError("Could not find a code snippet");
                return false;
            }

            var max;
            var maxCount = 0;
            for(var idx = 0; idx < codes.length; idx++){
                var codeSnippet = codes[idx];
                var loc         = codeSnippet.split('\n');
                if(typeof max == 'undefined'){
                    if(loc.length >= 20){
                        max         = codeSnippet;
                        maxCount    = loc.length;
                    }
                } else {

                    if(loc.length > maxCount){
                        max = codeSnippet;
                    }
                }
            }



            if(typeof max == 'undefined'){
                Searcher.logError("Could not find a suitable code snippet");
            } else {
                var code_sample = max;

                var result = JavaDetector.guessLanguage($(code_sample));
                var lang   = result.language;

                console.log("Detected " + lang + " language");

                if(!JavaDetector.isLanguageSupported(lang)){
                    Searcher.logError("Could not find any Java code inside");
                } else {

                    // todo(Huascar) maybe call Vesperin and use the compilation status as a
                    // way to select what code snippet to curate.
                    // "Clean" up the code
                    code_sample = code_sample.replace("<code>", "").replace("</code>", "");
                    code_sample = code_sample.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
                    //code_sample = code_sample.replace(/(console.log|alert)\(/g, "log("); // 'log' does nothing

                    console.log(code_sample);


                    if(Searcher.candidates.length >= 50){ // arbitrary number
                        Searcher.fetchCandidates(false);
                    } else {
                        Searcher.candidates.push(Searcher.answers[Searcher.item]);
                        Searcher.nextAnswer("Found a valid code snippet");
                    }

                }

            }


        },

        wait: function (state) {
            $('.sad-waiter').css({
                height: state ? 137 : 0
            }).find('.hour, .minute').css({
                display: state ? 'block' : 'none'
            });
            $('#stopper').toggleClass('hide', !state);
        }
    };

    Searcher.wait(false);

    $('#search').click(function() {
        // Disclaimer
        // TODO: Use better modal?
        var warn = "Ready for fetching arbitrary Java code from StackOverflow?";
        var ready = window.localStorage.ss_confirmed || confirm(warn);
        if(!ready) {
            return false;
        }
        window.localStorage.ss_confirmed = true;

        Searcher.reset();

        $('#search').attr('disabled', true).text('Searching...');
        $('#logger .oc').remove();
        $('#displayer .oc').remove();
        Searcher.stop = false;

        Searcher.search();
    });

    $('#stop').click(function() {
        Searcher.stop = true;
        return false;
    });

});