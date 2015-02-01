---
layout: default
title: Search Cue
hidden: true
description: StackOverflow Search Application
---

## Search Cue, a {{page.description}}

A brief introduction to get started with Search Cue.

Its easy to get started with it. You use it by pressing the **START** button below. Behind the scenes, the application fetches a few batches of code examples
from StackOverflow. Only the ones that match some criteria are kept.

The criteria we are using include: divide and conquer algorithms, containing only Java code,
with more than 25 lines of code. The final result is a list of 15 *randomly selected* code examples.

The first time you use it, the results get cached on your browser. After that, every time you search, this is done on your computer.

<div id="columns">
    <div id="left-col">
        <h4><strong>Searching console</strong><span class="searcher"><button class="octicon-button dark" id="search">START</button></span></h4>
        <div id="logger"></div>
        <div id="stopper" class="hide">
           Had enough? <a href="#" id="stop">Stop it!</a>
        </div>
    </div>
</div>
<div id="right-col">
    <h4><strong>Matching code examples</strong></h4>
    <div id="displayer"></div>
</div>
<div id="clear"></div>

Thank you for trying this app.