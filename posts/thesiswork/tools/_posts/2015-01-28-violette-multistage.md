---
layout: default
title: Violette with Multi Staging
hidden: true
description: Violette's Multi staging functionality
---

To evaluate **Violette**'s multi-staging functionality, I have put together the following
**experiment**. Please follow all of the instructions below:


# PREREQS

Make sure you have

1. Google Chrome latest version installed on your computer.
2. Uninstalled any previously installed Violette from Chrome.
3. Installed <a href="http://bit.ly/1IsfPG8" target="_blank">Violette-multi-staging-mode</a> on Chrome[^1].

# THE TASK

There will be 6 Java code examples to review and understand. For each example, there will be
a link to it. This link will take you to a page containing a StackOverflow's accepted answer.
This answer contains some Java code.

*For each linked Java code example, do the following*

1. You, the participant, must click on a linked code example.
This link will take you to the example's Q&A page at StackOverflow.

    Note: Don't click on the next link if you have not finished reviewing and understanding
    the previous Java code example

2. Once you are on that page, your goal is to review and understand the Java
code example in the accepted answer using multi-staging[^2].

    You'll activate this functionality by clicking on the `stage` button. This
    button is located on the top right corner of Violette. Each stage is represented
    as __named__ button. Stages are presented in ascending order; i.e., starting from
    `0` to `n` where `n` is the maximum number of stages that can be extracted from
    the code example.

3. After you've finished reviewing and understanding the Java code example, please
click on the _Bring it to Desktop_ button and then provide a description of the
goal behind this code example and the reason for using it. You may include fitness of
purpose, abstractions, usage protocols, etc. For example, imagine you reviewed an
implementation of the PageRank algorithm. Then a possible description of this algorithm
is "It models the behavior of a random web surfer using a Markov chain"

4. Lastly, after bringing the Java code example to your desktop, please comeback to the Violette
and then click on the "?" mark button on the bottom right corner of Violette. This will
take you to an online questionnaire. This questionnaire will help us capture your understanding
of the code example you've just curated.

5. Close the Q&A page and then comeback to Violette. Once there, click on the next Java code example to curate.

# TASK EXPECTATIONS

We expect the following throughout the task:

**1.** We expect you to review and understand a total of **6** Java code examples,
provided in this page.

**2.** We expect the whole task be done within **1 hr and 30 minutes**.

**3.** We expect the subjects to use only the resources available on the
question-answer page to complete the task; i.e., no external resources like
Wikipedia.

**4.** You will complete the [questionnaire](http://bit.ly/1OQoF0D) for each reviewed 
code example.

# LET'S GET STARTED

Before starting, please watch the following video. This video introduces violette and
the multi-staging functionality and UI.

<iframe
     width="532"
     height="400"
     src="https://www.youtube.com/embed/wNBjNcqbDdI"
     frameborder="0"
     allowfullscreen="allowfullscreen"> </iframe>

<!-- <a href="https://www.youtube.com/watch?v=wNBjNcqbDdI" target="_blank">Multi staging Quicksort</a>-->

So without further ado, please click on the link below to start the task:

1. <a href="http://stackoverflow.com/questions/14210307/android-how-to-get-specific-data-from-url-json#14210519" target="_blank">Example one</a>
2. <a href="http://stackoverflow.com/questions/22909429/android-save-a-bitmap-to-bmp-file-format#22914268" target="_blank">Example two</a>
3. <a href="http://stackoverflow.com/questions/21884805/libgdx-0-9-9-apply-cubemap-in-environment#22777350" target="_blank">Example three</a>
4. <a href="http://stackoverflow.com/questions/12560246/how-to-add-a-push-notification-in-my-own-android-app#12560639" target="_blank">Example four</a>
5. <a href="http://stackoverflow.com/questions/24176493/guice-dynamic-inject-with-custom-annotation" target="_blank">Example five</a>
6. <a href="http://stackoverflow.com/questions/3682587/split-string-of-varying-length-using-regex/3685197#3685197" target="_blank">Example six</a>


[^1]: Open Google Chrome and on the Url bar type `chrome://extensions`. Look for `violette-staging-no-summarization.crx`. Get the file and then drop it on the Chrome extension area. Press the `Add` button and you're done.

[^2]: Multi staged code examples are divided into a series of intermediate phases, presenting lower-level modules (supporting modules) before higher-level modules (main modules).