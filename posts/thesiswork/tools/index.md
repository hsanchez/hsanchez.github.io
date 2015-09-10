---
layout: default
title: Tools
---

In my ongoing quest for knowledge about the role of source curation in 
search-driven development, I've been working on a few source code curation 
tools. These tools will allow programmers to cope with the key challenges one 
typically experience when foraging for usable code examples on the Web. Some 
of these challenges include trying to reuse poorly structured, often 
incomplete, and with many syntax ambiguities. 

This section introduces **Vesperin**, a source code curation system for Java 
code examples, and the components that implement its functionality. At ICSE <a 
href="http://bit.ly/1EPzq4z" target="_blank">2015</a>, we described two of 
its components: a Chrome Extension (named Violette) for allowing developers 
to actually edit and change code examples in-place, and a RESTful service 
(named Kiwi) for managing curation and snippet parsing operations. Together, 
they provide a mechanism by which developers can examine code examples 
through a combination of manual and semi-automatic edits. Kiwi

The other components are Code multistaging, Codepacking, and Vesper. We 
distributed the overall functionality of these components between 
Violette and Kiwi.  


{% for post in site.categories.tools %}
  {% unless post.hidden %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

  {% endunless %}
{% endfor %}


The paper is available <a href="http://bit.ly/1EPzq4z" 
target="_blank">here</a>.

If you'd like to stay up to date on my research activities, join my mailing 
list using the mailing list button below. Thanks.
