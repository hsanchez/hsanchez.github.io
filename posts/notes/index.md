---
layout: default
title: Short notes
---

{% for post in site.categories.notes %}
  {% unless post.hidden %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

  {% endunless %}
{% endfor %}
