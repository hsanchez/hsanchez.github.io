---
layout: default
title: About
---

I am a a Postdoctoral fellow at [SRI International](https://www.sri.com/). As a Postdoc, I collaboratively investigate how to build scalable automated mechanisms to identify and repair program errors, and specification-based tools to create and synthesize new, custom programs based on collected knowledge gained through large code repository mining. 

As indicated in the <a href="/">welcome</a> page, my research focuses on addressing programmer productivity, human-computer interaction, and information retrieval issues in software engineering. I am interested in developing tools that can help programmers overcome their daily programming and code foraging barriers in order to make them more productive.    

At [San Jose State University](http://www.sjsu.edu/), the focus of my research was in domain analysis and pattern languages.

**Selected Graduate Coursework**

{% for post in site.categories.about %}

- [**{{ post.title }}**]({{ post.url }})

{% endfor %}

Cheers,  
Huascar A. Sanchez  
[e-mail](mailto:huascar.sanchez@sri.com)