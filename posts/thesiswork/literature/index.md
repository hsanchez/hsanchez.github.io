---
layout: default
title: Literature
---

This page collects some relevant literature.

{% for post in site.categories.literature %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}