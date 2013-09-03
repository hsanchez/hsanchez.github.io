---
layout: default
title: Talks
---

This page collects some of my recorded talks.

{% for post in site.categories.talks %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}