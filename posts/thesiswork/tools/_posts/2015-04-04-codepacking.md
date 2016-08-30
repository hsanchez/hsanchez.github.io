---
layout: default
title: Codepacking
description: Packing Code examples
hidden: true
---

## Codepacking

_Codepacking_ is a technique for automatically resolving incomplete code snippets. Its ultimate goal is not about achieving program correctness but approximating program completeness. _Codepacking_ produces an Abstract Syntax Tree (_AST_) of a partial program that _Vesperin_ can manipulate. 

_Codepacking_ consists of four steps:

1. Surrounds code example with the appropriate body declarations (class, method, or both), if needed. 
2. It cross references missing type information of existing ill-typed expressions with a repository of pre-acquired API information and then suggests their well-typed corrections. 
3. It uses Vesperin's code transformation utilities to add the suggested corrections to the example’s code. 
4. It produces the desired AST.


Codepacking's code is still private. However, once it becomes public, it 
will be available <a href="https://github.com/vesperin/" target="_blank">here</a>.

