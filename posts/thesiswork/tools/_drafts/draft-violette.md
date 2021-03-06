---
layout: default
title: Violette Vesper
description: a Chrome extension for curating Java source code.
---

## Violette, {{page.description}}

**Violette** is the companion Chrome extension to Vesper. It allows users to curate code snippets from example code blocks on StackOverflow.

I'll give an overview of some of the features you'll find on [Violette](https://www.dropbox.com/s/dpse9g1nojt4e73/vesper-web.crx) before asking you to try it.

# After installation ... 

After installation, you’ll find that Java code blocks (specifically `<pre>` tags) will be highlighted and have a tooltip appear in the right on hover. Click on the highlighted code block to start up a new Scratchspace editor.

{% include image.html url="http://www.huascarsanchez.com/static/highlight.png" description="Violette's Scratchspace" caption="Fig1. Highlighted Java code block." height = "310" width = "500"%}

# Unlocking the Scratchspace
 
After clicking on the highlighted code block, you may find the `Plus` and `Steps` buttons at the bottom of the Scratchspace editor [^1]. These buttons are the first (and easiest way) to get started with [Violette](https://www.dropbox.com/s/dpse9g1nojt4e73/vesper-web.crx). Click on any of them to unlock the Scratchspace editor.

{% include image.html url="http://www.huascarsanchez.com/static/PlusAndSteps.png" description="Get started with Violette" caption="Fig2. Unlocking Violette's Scratchspace." height = "176" width = "472"%}

Once pressed, any of these buttons will ask you to enter certain information to unlock the Scratchspace:

* `Plus`: It'll ask you to enter either a class name or a class name plus a method signature. This input uses the syntax `Class[#method(arg:type...):type]` where `Class` is a class name, and `[#method(arg:type...):type]` is an optional method signature. For example, you can either enter `Sorter`, `Sorter#sorts():void`, or `Sorter#sorts(array:Int[]):void`.     
* `Steps` [^3]: It'll ask you to enter a class name. For example, you can enter `Sorter`. 

# The Rest ...

The rest includes a `Toolbar`, an `Edit Tracker`, the `Comment Navigator`, the `Verify` and `Preview` buttons, and a few handy shortcuts.
 
To help you gradually achieve your source code curation goal, here is the Toolbar (See Fig2). One of Violette's main components. The toolbar is very handy in cases where you want to edit some code and want to make sure that edited code is still syntactically correct. 

**An important note** is that the `Delete`, `Rename`, and `Clip` functionality require a code selection in order to work. For example, if you want to rename a method called `foo`, the user must select the string `foo` before he or she can rename it using the `Rename` button. Failure to do so may result in an `invalid selection error`.            
      
{% include image.html url="http://www.huascarsanchez.com/static/toolbar.png" description="Violette's Toolbar" caption="Fig2. Violette's Toolbar." height = "186" width = "472"%}

If you’ve stopped editing for a moment and want to see what you have done in the last minute or so, drag the handle of the edit tracker (See Fig3) left. This is very useful during code editing. Specially in cases when you had made a mistake and want to correct that mistake via copy-and-paste [^2].

{% include image.html url="http://www.huascarsanchez.com/static/edittracker.png" description="Violette's Edit Tracker" caption="Fig3. Violette's Edit Tracker." height = "276" width = "472"%}

You can also add valuable information to any part or all of the code snippet via comments (See Fig2). Comments give meaningful feedback to those who edit code. So please, use them as much as possible to give more context to your edits. After commenting any code sections, you can see these commented sections highlighted on the Scratchspace editor by clicking on the `gray arrow` (See Fig4).     

{% include image.html url="http://www.huascarsanchez.com/static/comments.png" description="Violette's Comment Navigator" caption="Fig4. Violette's Comment Navigator." height = "230" width = "472"%}

Another cool feature of Violette is the `Verify` button (See Fig5). You can verify your code is syntactically correct at any time; i.e., Before and after any code edit. This button is found to the right-side of the Scratchspace editor's footer.   
 
{% include image.html url="http://www.huascarsanchez.com/static/verify-preview.png" description="Violette's Verify and Preview" caption="Fig5. Violette's Verify and Preview buttons." height = "256" width = "472"%}

As for the handy shortcuts, here they are:

* `Ctrl-F / Cmd-F`: Start searching for symbols in the code snippet.
* `Ctrl-G / Cmd-G`: Move to next found match.
* `Shift-Ctrl-G / Shift-Cmd-G`: Move to previous found match.
* `Shift-Ctrl-F / Cmd-Option-F`: Start replacing matches.
* `Shift-Ctrl-R / Shift-Cmd-Option-F`: Start replacing *ALL* matches.

There you have it. That was Violette. The next section will cover how you can help me evaluate it.

## Evaluation of Violette

To evaluate **Violette**, I have put together the following **experiment**:

You, the subject, will be asked to pick, from a list of *randomly selected* code snippets generated by this site, at least two code snippets to curate. Then, after curating the code snippets, you will be asked to complete a [survey](http://goo.gl/vzqmzG).

Today's theme for the experiment is *Sorting algorithms*. That is, this site will download the top answers from [Stackoverflow](http://www.stackoverflow.com) for the tags "java" and "sort". Then, it will inspect each answer to make sure there's some Java code inside. After that, it will randomly select 5 top answers from the generated list of top answers. These 5 top answers are the source code curation candidates.


## Before starting the task

Make sure you have 

1. Downloaded Google Chrome (**Version 36 or higher**) and it's now installed on your computer.
2. Downloaded [Violette](https://www.dropbox.com/s/dpse9g1nojt4e73/vesper-web.crx) and it's now installed on Google Chrome as a Chrome extension [^4]. 

**Important Note:** *Violette Chrome extension is still private; therefore, you won't be able to download it from this page. Please use the `crx` file that was sent to you via email.*   


## The Task

Your task is to **curate**—correct, improve, and extend—at least two code snippets selected from the list of 5 top answers. Your goal is to try to make your selected code snippets as reusable and complete as possible. Code snippets that are beyond repair can be skipped. In such a case, please pick another code snippet from the list of 5 top answers.

So without further ado, please press the **START** button to get your first batch of code snippets to curate.

**ProTip:** *Feel free to use any resource at your disposal to complete the curation task, including other answers near the accepted answer on Stackoverflow, books, blog posts, Java code solutions at Javapractices.com, or at Wikipedia, etc..*   

<div class="searcher">
    <button id="search">START</button>
</div>

<div id="columns">
    <div id="left-col">
        <h4><strong>Searching for candidates</strong></h4>
        <div id="logger"></div>
        <div id="stopper" class="hide">
           Had enough? <a href="#" id="stop">Stop it!</a>
        </div>
    </div>
</div>
<div id="right-col">
    <h4><strong>Listed candidates</strong></h4>
    <div id="displayer"></div>
</div>
<div id="clear"></div>


Thank you for trying **Violette**. Now, we need your feedback. Please take a few minutes to complete our [survey](http://goo.gl/vzqmzG).


## Additional information

All the curated code snippets will be available, as tweets, on Twitter. If you want to see them, please follow [@codedetour](https://twitter.com/codedetour).

[^1]: The `Plus` and `Steps` buttons will be enabled if the detected code blocks are not wrapped inside a class or a class' method (i.e., a sequence of statements). If they are, then you'll see the `Verify` button enabled and the `Plus` and `Steps` buttons disabled. 

[^2]: Undo or Redo edits are not allowed by design.   

[^3]: Use it if the `Plus` button logic is unable to wrap the example code block.
 
[^4]: Open Google Chrome and on the Url bar type `chrome://extensions`. Look for `vesper-web.crx`. Get the file and then drop it on the Chrome extension area. Press the `Add` button and you're done.  