# Church Visual Design — Dashboard Reference

Source: `guide.churchofjesuschrist.org/section-4-visual-design` (condensed)

## Scope Note

Per General Handbook 38.8.8, local units should not use the Church symbol or wordmark in local publications. This dashboard is for personal/calling use — use the **written Church name** in dignified typography. Avoid reproducing the official symbol or wordmark.

## Colors

Only one specific hex value is published in the Guide for logo use; the broader palette (v4.0) is maintained as CMYK swatches by the VIO. Safe defaults for a dashboard:

| Token        | HEX       | Usage                                                                   |
|--------------|-----------|-------------------------------------------------------------------------|
| Primary Blue | `#005175` | Headings, links, primary buttons (Blue 35 — the approved symbol color) |
| Black        | `#000000` | Body text                                                               |
| White        | `#FFFFFF` | Backgrounds                                                             |

**Research-backed associations** (guide if expanding the palette):
- Blues and greens → growth, spirituality
- Warm hues → relationship with God
- Deeper/richer tones → formal, sacred, reverent
- Brighter/vibrant tones → optimistic, inviting, energetic

**Contrast rule:** ≥50% luminance difference between text/logo and background.

## Typography

Only two approved typefaces:
- **McKay Pro** (serif) — primary, classic
- **Zoram** (sans serif) — secondary, modern (replaces Helam)

Both require licensing via `foundry.churchofjesuschrist.org`. For a personal dashboard, use dignified web-safe substitutes:

```css
/* Serif fallback for McKay */
font-family: 'Source Serif Pro', 'Georgia', serif;

/* Sans-serif fallback for Zoram */
font-family: 'Inter', 'Helvetica Neue', system-ui, sans-serif;
```

**Rules:**
- No decorative, display, or playful fonts
- Keep "Jesus Christ" on one line — never break across lines
- Headings lean serif (formal); body/UI can lean sans-serif (approachable)

## Logo / Name Usage

**Do not use the official symbol, wordmark, cornerstone, or Christus arch** in a local dashboard. Instead:

- Typeset the written Church name in McKay Pro or an approved serif fallback
- Do not stack, box, re-weight, or arrange the name to mimic the official wordmark
- Do not enclose the name in a cornerstone shape
- The Church name *may* appear in a phrase (e.g., event title); the symbol and wordmark may not
- When paired with another element (event name, dashboard title), emphasize the other element and keep the Church name subordinate and properly typeset

## Formality — Quick Decision

Default **informal and warm** unless content is sacred, authoritative, or official. Informal = brighter color, more Zoram, looser layout. Formal = deeper color, more McKay, reserved layout.

For a calling matrix dashboard: lean informal, approachable, optimistic.
