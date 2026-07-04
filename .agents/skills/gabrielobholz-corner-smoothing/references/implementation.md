# Apple Corner Smoothing Implementation

Use this when the user needs copy-pasteable code. It creates an Apple-like smoothed rounded rectangle path from `width`, `height`, `radius`, and `smoothing`.

## JavaScript Path Generator

```js
function appleCornerPath({ width, height, radius, smoothing = 60 }) {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const r = clamp(radius, 0, Math.min(w, h) / 2);
  const s = clamp(smoothing, 0, 100) / 100;

  if (!w || !h) return "";
  if (!r) return `M0 0H${w}V${h}H0Z`;

  if (s <= 0.001) {
    const c = r * 0.5522847498307936;
    return `M${r} 0H${w - r}C${w - r + c} 0 ${w} ${r - c} ${w} ${r}V${h - r}C${w} ${h - r + c} ${w - r + c} ${h} ${w - r} ${h}H${r}C${r - c} ${h} 0 ${h - r + c} 0 ${h - r}V${r}C0 ${r - c} ${r - c} 0 ${r} 0Z`;
  }

  const exponent = 2 + s * 3.35;
  const steps = 22;
  const points = [];

  const corner = (cx, cy, a0, a1) => {
    for (let i = 0; i <= steps; i += 1) {
      const a = a0 + (a1 - a0) * (i / steps);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const x = cx + r * Math.sign(cos) * Math.abs(cos) ** (2 / exponent);
      const y = cy + r * Math.sign(sin) * Math.abs(sin) ** (2 / exponent);
      points.push([+x.toFixed(3), +y.toFixed(3)]);
    }
  };

  points.push([r, 0], [w - r, 0]);
  corner(w - r, r, -Math.PI / 2, 0);
  points.push([w, h - r]);
  corner(w - r, h - r, 0, Math.PI / 2);
  points.push([r, h]);
  corner(r, h - r, Math.PI / 2, Math.PI);
  points.push([0, r]);
  corner(r, r, Math.PI, Math.PI * 1.5);

  const deduped = points.filter((point, index, all) => {
    if (index === 0) return true;
    const prev = all[index - 1];
    return point[0] !== prev[0] || point[1] !== prev[1];
  });

  return `M${deduped.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
}
```

## SVG Usage

```html
<svg width="300" height="300" viewBox="0 0 300 300" aria-hidden="true">
  <path id="card-shape" fill="#0081f2"></path>
</svg>

<script>
  document.querySelector("#card-shape").setAttribute(
    "d",
    appleCornerPath({ width: 300, height: 300, radius: 52, smoothing: 60 })
  );
</script>
```

## CSS Clip-Path Usage

Use this only when browser support is acceptable and the path dimensions match the element.

```js
const d = appleCornerPath({ width: 300, height: 300, radius: 52, smoothing: 60 });
element.style.clipPath = `path("${d}")`;
```

## Canvas Usage

```js
const d = appleCornerPath({ width: 300, height: 300, radius: 52, smoothing: 60 });
const path = new Path2D(d);
ctx.fill(path);
```

## Tuning

- `smoothing: 0` gives a normal circular rounded rectangle.
- `smoothing: 60` is the Apple/iOS-style default.
- `smoothing: 100` is the strongest smoothed/squircle-like treatment.
- Increase `steps` for very large rendered shapes; 22 is enough for most UI components.

