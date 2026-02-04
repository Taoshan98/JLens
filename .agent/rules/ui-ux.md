---
trigger: always_on
---

# UI Refactoring Agent - Next.js Application

## Mission
Completely refactor the user interface of the existing Next.js web application, implementing a modern design system with full support for dark mode, light mode, and automatic system mode.

## Core Requirements

### Theme Management
- Implement theming system with three modes:
  - **Light Mode**: clean and clear palette
  - **Dark Mode**: dark palette with optimal contrasts
  - **System Mode**: automatic detection of user's OS preferences
- Use `next-themes` or context API for global theme management
- User preference persistence in localStorage
- Smooth transitions between themes without content flash
- CSS custom variables for all colors and spacing
- Support `prefers-color-scheme` media query

### Design System Foundation

#### Color Palette
**Light Mode:**
- Background: light neutrals (#FAFAFA, #FFFFFF)
- Text: dark grays with high contrast (#0A0A0A, #171717)
- Accents: vibrant but not aggressive colors
- Borders: light grays (#E5E5E5, #D4D4D4)

**Dark Mode:**
- Background: dark neutrals (#0A0A0A, #171717, #262626)
- Text: light grays (#FAFAFA, #E5E5E5)
- Accents: saturated colors with adapted brightness
- Borders: dark grays (#404040, #525252)

#### Typography
- Modern font stack: Inter, SF Pro, system-ui, -apple-system
- Harmonic typographic scale: 12px, 14px, 16px, 20px, 24px, 32px, 48px
- Line height: 1.5 for body text, 1.2 for headings
- Font weight: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Letterspacing optimized for readability

#### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Consistent padding between related components
- Margin for semantic separation

### UI/UX Principles Implementation

#### Modern Style
- Minimalist design with focus on content
- Rounded corners (border-radius: 8px, 12px, 16px)
- Strategic use of subtle shadows for depth
- Optional glassmorphism for overlay elements
- Micro-interactions for immediate feedback

#### Readability
- Minimum WCAG AAA contrast (7:1) for main text
- Maximum width of 65-75 characters for text lines
- Generous spacing between elements
- Clear visual hierarchy through size, weight, and color

#### Visual Hierarchy
- Primary elements: larger sizes, high contrast, accent colors
- Secondary elements: medium sizes, medium contrast
- Tertiary elements: reduced sizes, low contrast
- Strategic use of whitespace for separation

#### Low Cognitive Load
- Max 3 primary actions visible simultaneously
- Logical grouping of related controls
- Clear and concise labels
- Visible states and immediate feedback

### Core UI Areas

#### JSON Input Editor
- Monaco Editor or CodeMirror with syntax highlighting
- Visible line numbers
- Auto-indentation and bracket matching
- Theme synchronized with dark/light mode
- Resize handle to adjust height
- Character/line count footer
- Inline syntax errors with underlining
- Prominent "Format" button
- Keyboard shortcuts (Ctrl/Cmd+S to save)

#### JSON Tree Viewer
- Expandable/collapsible structure
- Clear visual indentation (optional connection lines)
- Differentiated icons for types (object, array, string, number, boolean, null)
- Integrated search/filter
- Copy path on node click
- Breadcrumb for deep navigation
- Virtualization for performance with large JSON
- Highlight on hover for active node

#### Toolbar with Actions
- Sticky positioning (top or bottom)
- Actions logically grouped with separators
- Modern icons (Lucide, Heroicons, Phosphor)
- Descriptive tooltips on hover
- Visually clear disabled state
- Loading states for async actions
- Keyboard shortcuts visible in tooltips
- Responsive layout: collapses to hamburger menu on mobile

#### Clear Error Feedback
- Toast notifications for transient errors
- Inline banners for contextual errors
- Error codes with links to documentation
- Resolution suggestions when possible
- Colors: red for errors, yellow for warnings, blue for info, green for success
- Auto-dismiss for non-critical messages
- Collapsible stack trace for developers

### Interaction Rules

#### Smooth but Subtle Transitions
- Duration: 150-200ms for micro-interactions
- Easing: cubic-bezier(0.4, 0, 0.2, 1) or ease-in-out
- Transitions on: opacity, transform, color, background-color
- No transition on layout properties (width, height) unless necessary
- Motion reduction for users with `prefers-reduced-motion`

#### No Visual Clutter
- Hide advanced controls in menu/accordion
- Show max 2 levels of information simultaneously
- Icons without text for common actions (with tooltip)
- Condense metadata in info icon or popover
- Remove non-essential borders/dividers

#### Actions Must Be Obvious and Discoverable
- Primary buttons: accent color, high contrast
- Hover states with background/elevation change
- Focus states with visible outline for accessibility
- Icon + label for ambiguous actions
- Empty states with clear CTA
- Onboarding tooltip for new users (dismissible)

### Performance Requirements
- First Contentful Paint < 1s
- Time to Interactive < 2s
- Smooth 60fps animations
- Code splitting per route
- Lazy loading for heavy components (editor)
- Bundle size optimization: tree-shaking, dynamic imports
- Image optimization with next/image
- Prefetch for predictive navigation

#### Accessibility (A11Y)
- Semantic HTML (button, nav, main, aside)
- ARIA labels for icon-only actions
- Complete keyboard navigation (Tab, Enter, Escape)
- Focus trap in modals
- Screen reader announcements for state changes
- WCAG AA minimum color contrast

#### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Mobile-first layout
- Touch targets: minimum 44x44px on mobile

### Code Quality Standards
- TypeScript strict mode
- ESLint + Prettier configured
- Functional components with hooks
- Props interface for every component
- JSDoc comments for complex logic
- Unit tests for utility functions
- Storybook for component library (optional)

### Deliverables
1. Theme provider configured and working
2. All UI components refactored with new design
3. Component documentation in README
4. Comparative before/after screenshots
5. Performance audit results
6. Accessibility audit WCAG AA compliance