---
name: gabrielobholz-corner-smoothing
description: Apply Apple/iOS-style 60% corner smoothing to UI shapes without broken border-radius hacks. Use when implementing squircle-like rounded rectangles, Figma corner smoothing, iOS-style cards/buttons/icons, SVG path rounded rectangles, clip paths, canvas shapes, or when a user asks for radius plus smoothing percent values such as radius 52 and smoothing 60.
---

# Apple Corner Smoothing

Use path-based geometry when a design asks for Apple/iOS-like corner smoothing, especially the common 60% Figma Corner Smoothing look. CSS `border-radius` alone cannot express this shape.

## Quick Reference

| Need | Use |
| --- | --- |
| DOM/SVG rectangle | Generate a `<path d="...">` from width, height, radius, smoothing |
| CSS-only component | Use `clip-path: path("...")` when acceptable, otherwise inline SVG |
| Canvas/WebGL | Use the same sampled superellipse points as a polygon/path |
| Figma parity | Treat 60% as the Apple/iOS-style target |
| Plain rounded corner | Use `smoothing: 0` |

For copy-paste code, read [implementation.md](references/implementation.md).

## Core Principles

### 1. Do Not Fake It With Bigger Radius

Increasing `border-radius` changes the radius, not the corner transition. Apple-like smoothing keeps the same radius but eases the transition between straight edges and the corner.

### 2. Prefer Paths

Use SVG path data, `clip-path: path(...)`, Canvas `Path2D`, or framework-specific vector paths. This avoids layout hacks, nested masks, pseudo-elements, and broken edge cases.

### 3. Keep Radius Clamped

Always clamp radius to `min(width, height) / 2`. This prevents self-intersecting paths when components become small or responsive.

### 4. Make 60% The Apple Target

When a user asks for Apple/iOS-style corners and gives no other value, use `smoothing: 60`. Use 0% for normal circular `border-radius`, 100% only for maximum stylization.

### 5. Preserve Layout

The smoothing path should affect only drawing/clipping. Do not change element width, height, padding, or layout metrics while animating smoothing.

### 6. Animate The Path, Not The Box

When animating smoothing, keep `width`, `height`, and `radius` stable and update only the generated path. If also animating labels or numbers, use fixed-size containers and tabular numbers.

## Implementation Workflow

1. Read the requested width, height, radius, and smoothing percent.
2. If the target can be SVG, render a `<path>` and set its `d` attribute.
3. If the target must be HTML/CSS, use `clip-path: path(...)` only when browser support and scaling are acceptable; otherwise put an SVG behind or in front of the element.
4. Use `smoothing: 60` for Apple/iOS-style unless the user specifies another value.
5. Validate at small sizes and at maximum radius.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| `border-radius: 52px` and calling it smoothing | Generate a smoothed path |
| Radius larger than half the box | Clamp radius |
| Layout changes during smoothing animation | Keep layout fixed and update path only |
| Using one-off path strings | Use a reusable function with `radius` and `smoothing` |
| Applying 100% by default | Use 60% for Apple/iOS-style |
| Using CSS masks that blur edges | Prefer SVG path or clean vector clip |

## Review Checklist

- [ ] Radius is clamped to half the smaller side
- [ ] `smoothing: 60` is used for Apple/iOS-style unless specified otherwise
- [ ] The shape is path-based, not a border-radius-only approximation
- [ ] Width, height, and layout do not shift during smoothing changes
- [ ] The generated path works for square and rectangular shapes
- [ ] The component has a fallback or acceptable behavior if `clip-path: path()` is unsupported

