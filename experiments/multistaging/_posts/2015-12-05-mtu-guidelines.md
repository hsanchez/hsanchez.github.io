---
layout: default
title: Multistaging to Understand (MTU) Task
hidden: true
description: Goals and guidelines.
---

Please follow all of the instructions below:


# PREREQS

Make sure you have

1. Google Chrome latest version installed on your computer.
2. Uninstalled any previously installed Violette from Chrome.
3. Installed <a href="http://bit.ly/1IsfPG8" target="_blank">Violette-multi-staging-mode</a> on Chrome[^1].

# GUIDELINES FOR THE MULTI STAGING TO UNDERSTAND

## GOAL

Gain understanding in

* Control flow:   what is the sequence of execution?
* State:          what is the content of a data object?
* Operations:     what does the code compute?
* Data flow:      where does a data object get updated?
* Function:       what is the overall functionality?


## GUIDELINES

1. Inspect each code example (one at a time). 
2. Spend your time wisely, don't go outside the Q&A page.
3. Click on the *stage* button[^3] to generate an ordered set of stages[^4]; e.g., 0:stage-name, 1:stage-name, ..., N:stage-name 
4. Review the name of the stages in the order they appeared.    
5. Iteratively click on any of the generated code stages to introduce a subset of the given Java code example's behavior. E.g., Click stages in any order.    
     4.1 Open any hidden code blocks as you go along, and then try to understand its enclosed elements.    
6. Review the introduced subset of behavior to make sure you understand what it is actually doing.   


# THE TASK

There will be 3 Java code examples (Accepted Answers) to review and understand. 
These examples were extracted from StackOverflow. Your task is to use the 
Multistaging to Understand (MTU) comprehension technique to dig into each of the 
Java code examples. This technique involves a few steps. Given a series of code stages 
(extracted from a code example), you will non-sequentially inspect a few of these 
stages, mentally abstract their functionality, and then use that knowledge to understand 
the example’s intended function. After 30 minutes, per Java code example, you will be 
asked to answer a number of questions about the reviewed piece of code. 


For each example, there will be two links. First link will take you to a page 
containing a StackOverflow's accepted answer. This answer contains some Java code. 
Second link will take you to an online questionnaire where you'll answer a number 
of program comprehension questions about the reviewed piece of code.

After you've finished reviewing and understanding the Java code example, please
click on the _Bring it to Desktop_ button and then provide a brief description of the
(1) goal behind this code example and (2) the reason for using it. Then, please 
press the _enter_key to record your answer.

Please comeback to the experiment page after bringing the Java code example onto 
your desktop. Then, click on the Java code example's second link to answer the 
program comprehension questionnaire.

After answering the program comprehension questionnaire, close its page and then 
comeback to the experiment page. Once there, click on the next Java code example 
to review.

Lastly, after reviewing all code examples and answering their questionnaires, please answer 
our <a href="http://bit.ly/1KPyrlW" target="_blank">debriefing questionnaire</a>.


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

So without further ado, please click on the first link of Code Example 1 below to start the task:

**1.** Code Example 1 (<a href="http://bit.ly/1Mt3TEL" target="_blank">code</a>, <a href="http://bit.ly/1BLdRe4" target="_blank">program comprehension questionnaire</a>)     
**2.** Code Example 2 (<a href="http://bit.ly/1Kd9oYF" target="_blank">code</a>, <a href="http://bit.ly/1FV2Drr" target="_blank">program comprehension questionnaire</a>)    
**3.** Code Example 3 (<a href="http://bit.ly/1Kd9xeJ" target="_blank">code</a>, <a href="http://bit.ly/1KNTkhw" target="_blank">program comprehension questionnaire</a>)  


[^1]: Open Google Chrome and on the Url bar type `chrome://extensions`. Look for `violette-staging-no-summarization.crx`. Get the file and then drop it on the Chrome extension area. Press the `Add` button and you're done.

[^3]: This button is located on the top right corner of Violette. Each stage is represented as __named__ button. Stages are presented in ascending order; i.e., starting from `0` to `n` where `n` is the maximum number of stages that can be extracted from the code example.

[^4]: If after clicking on the stage button you get an error (red box) from the server, then please refresh the Web page and retry to stage the example.