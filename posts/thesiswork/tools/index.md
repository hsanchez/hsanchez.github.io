---
layout: default
title: Tools
---

In my ongoing quest for knowledge about the role of source curation in search-driven development, 
I've been working on developing a few tools. These tools will allow code foragers to cope with 
the key challenges one typically experienced when searching for suitable code snippets on the Web. 
Some of these challenges include trying to reuse cryptic, poorly structured, and incomplete code 
snippets. 

These tools will allow them to deal with these challenges upfront; before consuming these code 
snippets (while still inside the Web browser). 
    
I **hypothesize** that by enhancing search interfaces (e.g., Web browser) with source code curation tools 
can (1) help code foragers to cope with key challenges upfront, and (2) to gain confidence in the 
found code, in terms of completeness, fitness of purpose, documentation, proper abstractions, etc., 
that goes through curation process.

To test the above hypothesis, here are the first batch of tools I'd like you to experiment with:   
     
{% for post in site.categories.tools %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}