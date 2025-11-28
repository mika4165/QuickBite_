# QuickBite Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern food delivery platforms (Uber Eats, GrabFood, DoorDash) combined with social commerce aesthetics (Instagram shopping). Focus on food-first visual hierarchy with clean, appetizing presentation.

**Core Design Principles**:
- Food photography takes center stage
- Clear visual hierarchy prioritizing images over text
- Trust-building through ratings and reviews
- Streamlined, mobile-first ordering flow
- Professional yet approachable aesthetic suitable for students

## Typography

**Font Stack**: 
- Primary: Inter or DM Sans (clean, modern sans-serif via Google Fonts)
- Headings: Font weight 600-700
- Body text: Font weight 400
- Small text/labels: Font weight 500

**Type Scale**:
- Hero/Store Names: text-3xl to text-4xl
- Section Headers: text-2xl
- Card Titles: text-lg
- Body/Descriptions: text-base
- Labels/Meta: text-sm
- Timestamps/Small details: text-xs

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-16
- Card gaps: gap-4 to gap-6
- Tight spacing: space-y-2

**Grid System**:
- Store gallery: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Meal items: grid-cols-1 md:grid-cols-2 xl:grid-cols-3
- Order cards: Single column with max-w-4xl
- Mobile-first responsive approach

## Component Library

### Navigation
- Fixed top navigation bar with logo, search, cart badge, and profile
- Bottom navigation for mobile (Home, Orders, Messages, Profile)
- Breadcrumb navigation within store/ordering flow
- Subtle shadow/border for depth

### Store Cards
- Large featured image (16:9 aspect ratio, 300-400px height)
- Store logo overlay (bottom-left corner, circular, 64px)
- Star rating display (large, prominent)
- Store name and category badge
- Hover effect: subtle scale transform and shadow increase

### Meal Item Cards
- Square or slightly rectangular food image (1:1 or 4:3, fill container)
- Price badge (top-right corner)
- Title and brief description
- Availability indicator (green dot or "Out of Stock" overlay)
- Add to cart button at bottom
- Clean white card with subtle shadow

### Rating & Reviews
- 5-star display with half-star precision
- Large star icons (text-xl or larger)
- Review count next to rating
- Individual review cards with user avatar, rating, comment, timestamp
- Star input interface for leaving reviews

### Order Status Flow
- Horizontal step indicator with icons
- Steps: Pending Payment → Payment Submitted → Confirmed → Ready → Claimed
- Active step highlighted with accent color
- Completed steps with checkmark
- Visual progress line connecting steps

### Messaging Interface
- Chat bubble layout (left for staff, right for student)
- Avatar circles for each participant
- Timestamp below messages
- Input box at bottom with send button
- Floating on order detail page or dedicated messaging screen

### Payment Upload
- Large display of store's GCash QR code (centered, 300x300px minimum)
- Clear instructions above QR
- File upload button with image preview
- Confirmation modal showing uploaded payment proof

### Staff Dashboard
- Tab navigation (Pending, Confirmed, Ready, Claimed)
- Order cards grouped by pickup time slots
- Quick action buttons (Confirm, Ready, Claimed)
- Payment proof thumbnail preview

## Images

**Hero Section**: No traditional hero. Lead with a clean header + immediate store gallery below.

**Store Gallery**:
- High-quality store/canteen photos showing food preparation areas, ambiance
- Each store: 1 featured banner image + 1 logo
- Authentic, bright, appetizing photography

**Meal Images**:
- Professional food photography or high-quality photos
- Well-lit, close-up shots showing food details
- Consistent image treatment (slight saturation boost, warm tones)
- Square cropping for grid uniformity

**Placeholders**: Use food/store themed illustrations or subtle patterns when no image is available

**Other Images**:
- User avatars (circular, 40-48px for reviews/messages)
- QR code display (high contrast, large and scannable)
- Payment proof thumbnails (clickable to full size)

## Visual Enhancements

**Cards & Containers**:
- Subtle shadows (shadow-sm to shadow-md)
- Rounded corners (rounded-lg to rounded-xl)
- Clean white backgrounds with good contrast

**Interactive Elements**:
- Buttons: Solid fills with rounded corners (rounded-lg), medium padding (px-6 py-3)
- Hover states: slight brightness change and shadow lift
- Active/selected states: border accent or background tint

**Badges & Tags**:
- Small rounded pills (rounded-full, px-3 py-1, text-xs)
- Category badges, availability indicators, status labels
- Color-coded by meaning (green=available, red=out of stock, blue=info)

**No Animations**: Keep interactions instant and responsive without distracting transitions

## Page Structures

**Student Home**: Store gallery grid with search/filter bar at top, featured stores section

**Store Detail**: Store header (banner image, logo, name, rating, description) → Menu grid below

**Order Flow**: Multi-step with progress indicator → Store selection → Meal selection → Cart review → Payment → Confirmation

**Staff Dashboard**: Sidebar navigation, main content area with filterable order cards

**Messaging**: Split view (order details left, chat right) on desktop, full-screen chat on mobile

This design creates a modern, food-focused experience that prioritizes visual appeal while maintaining the functional efficiency needed for a school canteen pre-order system.