# DESIGN.md

## 1. Product Design Intent

This product is a **futsal team community service**.
It should feel like a polished Korean consumer app, while still being reliable enough for real operational work.

The design must balance these three qualities:

1. **Fast to understand**
   - Users should understand the current status, next action, and main content within 2-3 seconds.
2. **Warm and reassuring**
   - The service should not feel cold, rigid, or enterprise-heavy.
   - It should reduce anxiety during connection, waiting, recording, saving, and support flows.
3. **Operationally clear**
   - Live states, session controls, upload progress, chat, and consultation history must be visually unambiguous.

### Core Style Blend
- **Warm Depth** for surface hierarchy and emotional tone
- **Toss-like clarity** for layout, cards, summaries, and decision flow
- **Community workflow specialization** for video, schedule, attendance, stats, and announcement interfaces

### Emotional Keywords
- trustworthy
- calm
- warm
- clear
- efficient
- modern
- mobile-native
- human-centered

---

## 2. Visual Theme & Atmosphere

### Overall Mood
The interface should feel like:
- a premium Korean service app
- soft but structured
- practical, not decorative
- modern without looking trendy for its own sake
- friendly without being cute or childish

### Density
Use **medium information density**:
- more structured than a landing page
- less heavy than a legacy admin system
- dense enough to be useful
- open enough to breathe

### Design Philosophy
- clarity before style
- hierarchy before decoration
- progress before explanation
- confidence without visual aggression

### Surface Character
- bright backgrounds
- white and warm-neutral cards
- soft shadows
- minimal noise
- clear layer separation
- no flashy gradients, neon, glassmorphism, or overly synthetic AI aesthetics

---

## 3. Product-Specific UX Principles

### 3.1 Dashboard Must Be Immediately Legible
At every moment, users should clearly understand:
- upcoming match schedule and D-day
- recent announcements
- latest highlight videos
- attendance status for next event

### 3.2 Video Gallery Needs Strong Visual Priority
During video browsing, visual priority should be:

1. video thumbnails with match info
2. filter/category controls
3. match metadata (date, opponent, score)
4. detailed statistics

### 3.3 Schedule & Attendance Should Feel Operational but Light
Schedule pages should feel:
- organized
- fast
- dependable
- not cluttered
- not "corporate dashboard heavy"

### 3.4 Stats Should Reduce Cognitive Load
Statistics pages should feel:
- easy to scan
- guided
- clear rankings
- low-friction comparison
- understandable even for casual members

### 3.5 Progress and Status Must Always Be Visible
For actions like:
- attendance voting
- video uploading
- schedule confirmation

Use explicit status UI with both:
- text
- color/icon/shape

Never rely on color alone.

---

## 4. Color Palette & Roles

### Core Brand Behavior
Use a neutral base with one strong action color and one restrained warm accent.

### Primary Colors
| Token | Hex | Role |
|---|---:|---|
| `primary-500` | `#3182F6` | main CTA, selected state, links, focus |
| `primary-600` | `#2272EB` | pressed / stronger emphasis |
| `primary-050` | `#EEF6FF` | subtle selected or highlighted background |

### Warm Accent Colors
| Token | Hex | Role |
|---|---:|---|
| `warm-050` | `#FFF8F2` | soft guidance surface |
| `warm-100` | `#FDF1E6` | supportive card tint |
| `warm-400` | `#F59E63` | mild accent |
| `warm-500` | `#E8833A` | warm emphasis / friendly secondary accent |

### Neutral Colors
| Token | Hex | Role |
|---|---:|---|
| `gray-000` | `#FFFFFF` | main surface |
| `gray-050` | `#F9FAFB` | app background |
| `gray-100` | `#F2F4F6` | grouped surface / subtle section |
| `gray-200` | `#E5E8EB` | borders |
| `gray-300` | `#D1D6DB` | inactive strokes |
| `gray-500` | `#8B95A1` | secondary text |
| `gray-700` | `#4E5968` | body text |
| `gray-900` | `#191F28` | primary text |

### Semantic Colors
| Token | Hex | Role |
|---|---:|---|
| `success-500` | `#16B364` | success / saved / completed |
| `success-050` | `#ECFDF3` | success background |
| `warning-500` | `#F79009` | pending / caution / unstable |
| `warning-050` | `#FFFAEB` | warning background |
| `danger-500` | `#F04452` | error / disconnected / destructive |
| `danger-050` | `#FEF3F2` | error background |
| `info-500` | `#3182F6` | informational support |

### Usage Rules
- the interface should stay mostly neutral
- primary blue is for major actions and selected states
- warm colors are supportive, not dominant
- semantic colors must reflect meaning, not decoration
- avoid using too many strong colors in one screen
- status-heavy screens should still look calm

---

## 5. Typography Rules

### Font Stack
Use a clean Korean-first sans-serif stack:

```
font-family:
  "Pretendard",
  "Inter",
  "Apple SD Gothic Neo",
  "Noto Sans KR",
  sans-serif;
```

### Type Scale
| Name | Size | Weight | Use |
|---|---:|---:|---|
| heading-xl | 24px | 700 | page title |
| heading-lg | 20px | 700 | section header |
| heading-md | 17px | 600 | card title, modal title |
| body-lg | 16px | 400 | primary body text |
| body-md | 14px | 400 | default content |
| body-sm | 13px | 400 | supporting content |
| caption | 12px | 400 | labels, timestamps, metadata |

### Typography Rules
- line height: 1.5 for body, 1.3 for headings
- use semibold (600) for emphasis, bold (700) only for headings
- avoid all-caps except for short status labels
- maintain consistent vertical rhythm
- Korean text should never feel cramped

---

## 6. Spacing & Layout

### Base Grid
Use a 4px base unit.

### Spacing Scale
| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |

### Section Spacing
- between major sections: 32px
- between cards in a list: 12px
- card internal padding: 16px
- screen horizontal padding: 20px

### Border Radius
| Token | Value |
|---|---:|
| `radius-sm` | 8px |
| `radius-md` | 12px |
| `radius-lg` | 16px |
| `radius-xl` | 20px |
| `radius-full` | 9999px |

---

## 7. Component Patterns

### Cards
- white background on gray-050 surface
- 12-16px padding
- radius-md (12px) corners
- subtle shadow or 1px border (gray-200)
- clear content hierarchy inside

### Buttons
- primary: primary-500 background, white text, radius-md
- secondary: gray-100 background, gray-700 text
- ghost: transparent, primary-500 text
- minimum touch target: 44px height
- consistent horizontal padding: 16-20px

### Status Indicators
- always combine color + icon + text
- use semantic color tokens
- pill-shaped badges with radius-full
- small dot indicators for compact spaces

### Bottom Tab Bar
- 5 max items
- icon + label for each tab
- active: primary-500 color
- inactive: gray-500 color
- subtle top border (gray-200)
- safe area padding at bottom

### Lists
- consistent row height
- clear tap targets
- subtle separators (gray-100 or gray-200)
- right-aligned metadata or chevrons
