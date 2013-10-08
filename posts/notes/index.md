---
layout: default
title: Short notes
---

{% for post in site.categories.notes %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}