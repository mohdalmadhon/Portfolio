---
title: How this voxel portfolio is built
date: 2026-01-01
excerpt: Sample article. A short walkthrough of the rendering, the skeleton reveal shader and the GitHub data pipeline. Replace or delete this file.
category: Sample
tags: three.js, vue, shaders
sample: true
---

This is **sample content**. It only appears in development or with `?drafts` in the URL. Delete `src/content/posts/sample-building-this-portfolio.md` and add your own Markdown files to publish real articles.

## The world

The island is built from instanced cubes, one draw call per block type, with hidden blocks culled before upload.

## The skeleton reveal

Two models share one rig. The skin material discards fragments inside a screen-space circle around the cursor, and the skeleton material discards everything outside it.

```glsl
float d = distance(gl_FragCoord.xy, uRevealCenter);
if (d < uRevealRadius) discard;
```

## Data

A GitHub Action collects public repository data at build time and publishes it as a static JSON file.
