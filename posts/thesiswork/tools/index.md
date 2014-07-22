---
layout: default
title: Tools
---

This page lists some of the tools I'm currently working on as part of my research.

{% for post in site.categories.tools %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}