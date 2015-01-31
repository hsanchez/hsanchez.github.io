---
layout: default
title: Violette with Multi Staging
hidden: true
description: Evaluating Violette's Multi staging functionality.
---

To evaluate **Violette**'s functionality, I have put together the following
**experiment**. Please follow all of the instructions below:


# PREREQS

Make sure you have downloaded

1. Google Chrome latest version and is now installed on your computer.
2. [Violette](https://www.dropbox.com/s/dpse9g1nojt4e73/vesper-web.crx) Chrome extension and is now installed on Chrome[^4].

# THE TASK


1. You, the subject, must click on a linked code example below.
This link will take you to StackOverflow; particularly, it will take you
to an accepted answer containing some Java code.

2. Once you are on that page, your goal is to review and understand the example using a hybrid
comprehension strategy, which involves mixing top down[^1] and bottom up[^2]
comprehension strategies.

    For this task, you will be using **Violette**. Particularly, **Violette**'s
  multi-staging functionality[^3].

    If **Violette**'s scratchspace cannot be activated when clicking on the code
  example, feel free to comeback to this page and then refresh it. This will give you a
  new example to play with.

    Please record the examples where **Violette** could
  get activated.

3. Lastly, after you've finished trying to understand the code example, you will
be asked to complete a [survey](http://goo.gl/vzqmzG).

# TASK EXPECTATIONS

We expect the following throughout the task:

**1.** We expect the subject to watch this 5 minute intro to Violette.

**2.** We expect the whole task be done within **60 minutes**.

**3.** We expect the subjects to use only the resources available on the
question-answer page to complete the task.

**4.** For those completing the survey, if you've previously received a key or username from me,
then use it as the answer for the survey's first question; i.e., the one asking to provide your name.


# LET'S GET STARTED

So without further ado, please click on the link below to start the task:

<div id="example">
</div>


Thank you for participating in this experiment. Now, we need your feedback. Please take a few minutes to complete our [survey](http://goo.gl/vzqmzG).


<script>
  function shuffle(array) {
      var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex   = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue      = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex]  = temporaryValue;
      }

      return array;
  }

  $(document).ready(function(){



     // use this https://github.com/marcuswestin/store.js
     // http://jsfiddle.net/hHLXr/12/
     // http://okta6.ideone.com/gfx2/js/ideone-index.js
     // http://html5demos.com/contenteditable
     var cached   = JSON.parse(window.localStorage.getItem('cached'));
     var shuffled = shuffle(cached.items);

     var selected = shuffled[0] || null;
     if(selected != null){

       var replace = $("<div/>", {'class':'file-editor', 'html': 'A. ', 'style': 'font-weight: bold;'});
       var link    = $('<a>', {
        'text': selected.title,
        'href': selected.href,
        'target': selected.target,
        'style': 'cursor: pointer;'
       });

       replace.append(link);

       $("#example").replaceWith(replace);
     }


  });
</script>

[^1]: Top down comprehension is a strategy in which a programmer reconstructs knowledge about the program domain and map it to the code example.

[^2]: Bottom up comprehension is a strategy in which a programmer reads code statements and mentally (or physically) group these statements.

[^3]: Multi staged code examples are divided into a series of intermediate phases, presenting lower-level modules (supporting modules) before higher-level modules (main modules).

[^4]: Open Google Chrome and on the Url bar type `chrome://extensions`. Look for `vesper-web.crx`. Get the file and then drop it on the Chrome extension area. Press the `Add` button and you're done.










