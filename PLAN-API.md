# Animated Pills/Badges Component Plan

## Overview

Build premium animated pill/badge components with GSAP. Standalone component (not a library yet).

**Features:**
- Micro-interactions (hover: scale, glow, color shift, magnetic cursor)
- Entrance animations (staggered fade-in, slide, bounce)
- Status indicators (pulsing dots, shimmer, live/online states)

---

## Component API

```tsx
<Pill
  variant="default" | "success" | "warning" | "error" | "gradient"
  size="sm" | "md" | "lg"
  animate="entrance" | "none"          // entrance animation
  status="live" | "online" | "pulse"   // optional status indicator
  magnetic={true}                       // cursor magnetic effect
  glow={true}                           // hover glow effect
>
  New Feature
</Pill>

<Badge count={5} pulse />              // notification badge variant
```

---

## Animation Details

### Micro-interactions (hover)
- Scale up slightly (1.05x)
- Glow/shadow intensifies
- Magnetic effect - follows cursor slightly
- Color shift on gradient variants

### Entrance Animations
- Fade + slide up
- Stagger when multiple pills in a group
- Bounce/spring easing

### Status Indicators
- Pulsing dot (like "Live" indicators)
- Shimmer effect across surface
- Breathing glow for "online" status

---

## Implementation Steps

### 1. Create Base Component
- `src/components/Pill.tsx`
- Base styling with Tailwind
- Variant system (colors, sizes)

### 2. Add GSAP Animations
- Hover effects with `gsap.to()`
- Entrance animation with `gsap.fromTo()`
- Status pulse with `gsap.timeline()` loop

### 3. Magnetic Cursor Effect
- Track mouse position relative to pill
- Subtle transform toward cursor on hover

### 4. Polish
- Accessible (keyboard focus states)
- Reduced motion support (`prefers-reduced-motion`)
- SSR-safe (no window access on server)

---

## File Structure

```
src/components/
  Pill.tsx              # main component
  PillGroup.tsx         # for staggered entrance of multiple pills
  Badge.tsx             # notification badge variant
```

---

## Variants

| Variant | Style |
|---------|-------|
| `default` | Subtle gray background |
| `success` | Green |
| `warning` | Yellow/orange |
| `error` | Red |
| `gradient` | Animated gradient background |
| `outline` | Border only, transparent bg |
| `glass` | Glassmorphism effect |
