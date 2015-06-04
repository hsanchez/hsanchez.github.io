---
layout: default
title: Violette with Multi Staging
hidden: true
description: Multi staging to Understand Experiment
---

To evaluate **Violette**'s multi-staging functionality, I have put together the following
**experiment**. Please follow all of the instructions below:


# PREREQS

Make sure you have

1. Google Chrome latest version installed on your computer.
2. Uninstalled any previously installed Violette from Chrome.
3. Installed <a href="http://bit.ly/1IsfPG8" target="_blank">Violette-multi-staging-mode</a> on Chrome[^1].

# GUIDELINES FOR THE MULTI STAGING OF CODE EXAMPLES EXPERIMENT

## GOAL

Gain understanding in

* Control flow:   what is the sequence of execution?
* State:          what is the content of a data object?
* Operations:     what does the code compute?
* Data flow:      where does a data object get updated?
* Function:       what is the overall functionality?


## GUIDELINES FOR MULTI STAGING[^2]

1. Spend your time wisely, no manual beautification.
2. Click on the *stage* button[^3].  
3. Iteratively click on any of the stages generated (in any order) to introduce 
a subset of the given Java code example’s behavior.    
4. Review the introduced subset of the given Java code example’s behavior to make
sure you understand what this subset is actually doing.   


# THE TASK

There will be 3 Java code examples to review and understand. Use the appointed 
comprehension technique (either Read to Understand or Multi staging to Understand) 
to dig into each of the Java code examples. After 30 minutes, per Java code example, 
you will be asked to answer a number of questions about the reviewed piece of code.

For each example, there will be two links. First link will take you to a page 
containing a StackOverflow's accepted answer. This answer contains some Java code. 
Second link will take you to an online questionnaire where you'll answer a number 
of questions about the reviewed piece of code.

After you've finished reviewing and understanding the Java code example, please
click on the _Bring it to Desktop_ button and then provide a brief description of the
goal behind this code example and the reason for using it. Then press the _enter_
key.

After bringing the Java code example to your desktop, please comeback to the 
experiment page. Then, click on the Java code example's second link to answer the 
questionnaire.

After answering the questionnaire, close its page and then comeback to the experiment 
page. Once there, click on the next Java code example to review.

# TASK EXPECTATIONS

We expect the following throughout the task:

**1.** We expect you to review and understand a total of **3** Java code examples,
in the **order provided** in this page.

**2.** We expect the whole task be done within **2 hrs**; including the 
the time spent reviewing this page.

**3.** We expect the subjects to use only the resources available on the
question-answer page to complete the task; i.e., no external resources like
Wikipedia should be used.


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

So without further ado, please click on the links below to start the task:

* Example 1
<ul>
  <li><a href="http://stackoverflow.com/questions/26818478/generating-random-license-plate" target="_blank">Example seven</a></li>
  <li><a href="http://bit.ly/1FV2Drr" target="_blank">Questionnaire</a></li>
</ul>

* Example 2
<ul>
  <li><a href="http://stackoverflow.com/questions/21884805/libgdx-0-9-9-apply-cubemap-in-environment#22777350" target="_blank">Source code</a></li>
  <li><a href="http://bit.ly/1BLdRe4" target="_blank">Questionnaire</a></li>
</ul>

* Example 3
<ul>
  <li><a href="http://stackoverflow.com/questions/14210307/android-how-to-get-specific-data-from-url-json#14210519" target="_blank">Source code</a></li>
  <li><a href="http://bit.ly/1KNTkhw" target="_blank">Questionnaire</a></li>
</ul>


[^1]: Open Google Chrome and on the Url bar type `chrome://extensions`. Look for `violette-staging-no-summarization.crx`. Get the file and then drop it on the Chrome extension area. Press the `Add` button and you're done.

[^2]: Multi staged code examples are divided into a series of an ordered set of code stages, where each code stage code fragments captures a subset of the given Java code example’s behavior.

[^3]: This button is located on the top right corner of Violette. Each stage is represented 
as __named__ button. Stages are presented in ascending order; i.e., starting from `0` to `n` 
where `n` is the maximum number of stages that can be extracted from the code example.