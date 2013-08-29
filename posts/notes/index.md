---
layout: default
title: Notes
---

{% for post in site.categories.notes %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

{% endfor %}