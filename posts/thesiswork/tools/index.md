---
layout: default
title: Tools
---

In my ongoing quest for knowledge about the role of source curation in search-driven development, 
I've been working on a few source code curation tools. These tools will allow code foragers to cope 
with the key challenges one typically experience when searching for suitable code snippets on the 
Web. Some of these challenges include trying to reuse cryptic, poorly structured, and incomplete code 
snippets. 

The idea is to allow code foragers to deal with these challenges upfront; i.e., while still inside 
the Web browser and before the consumption of these code snippets in some editor (or IDE). 
    
I **hypothesize** that enhancing search interfaces (e.g., Web browser) with source code curation 
tools can (1) help code foragers to cope with key challenges upfront, and (2) to gain confidence in 
the found code that goes through a curation process. That is, confidence in terms of completeness, 
fitness of purpose, documentation, proper abstractions, etc., .

To test the above hypothesis, I am presenting the first batch of tools I'd like you to experiment 
with:   
     
{% for post in site.categories.tools %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}


If you want to know more about this research, please join my mailing list (See below). Thanks.