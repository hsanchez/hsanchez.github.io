---
layout: default
title: Tools
---

This section presents **<a href="https://github.com/vesperin/" target="_blank">Vesperin</a>**[^1], a source code curation system for Java code examples. _Vesperin_'s goal is to provide an abstraction that allows programmers to curate online source code as a set of manual and semi-automatic edits, as well as extra documentation.

_Vesperin_ consists of two main components: a Chrome Extension (named [**Violette**]({% post_url 2014-07-22-violette %})) for allowing developers to curate online source code _in place_, and a RESTful service (named [**Kiwi**]({% post_url 2014-07-22-kiwi %})) for managing source code curation and parsing operations. Together, they provide an interface designed to make it easy for programmers to examine (via curation) the online source code they encounter.

## Vesperin Actions

Each of _Vesperin_'s components and functionality are listed herein:

{% for post in site.categories.tools %}
  {% unless post.hidden and post.limited %}

- {{ post.description | strip_html }} ([**{{ post.title }}**]({{ post.url }}))
     
  {% endunless %}
{% endfor %}

If you'd like to stay up to date on my research activities, join my mailing 
list using the mailing list button below. Thanks.

[^1]: Parts of section are published in a conference paper at the International Conference on Software Engineering (ICSE) 2015 titled "Source Code Curation on StackOverflow: The Vesperin System."
