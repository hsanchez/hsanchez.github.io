---
layout: default
title: Posts
---

This page collects all my new posts. Check back to read posts on software engineering, computer science, and my thesis work. Or just [subscribe](./atom.xml) to my site to learn about new posts.

{% for post in site.posts %}
  {% unless post.hidden %}

- [**{{ post.title }}**]({{ post.url }}) {{ post.description | strip_html }}

  {% endunless %}
{% endfor %}