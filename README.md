# 24/7 Student Platform

A comprehensive web application designed to enhance student life with essential features for academic and social support.

## 🌟 Features

### 📚Forum
- **Question & Answer**: Students can post questions and get answers from peers
- **Ideas & Discussions**: Share innovative ideas and engage in meaningful discussions
- **Anonymous Posting**: Option to post anonymously for sensitive topics
- **Real-time Interactions**: Like posts, reply to discussions, and build community

### ⭐Reviews
- **Facility Ratings**: Rate and review toilets, canteens, and study spaces
- **Course & Professor Reviews**: Help fellow students choose the best courses and instructors
- **Real-time Occupancy**: Color-coded system showing facility traffic levels

### 🤝Connect
- **Student Profiles**: Create detailed profiles with major, hobbies, and skills
- **Knowledge Marketplace**: Students can offer tutoring services for payment
- **Skill Matching**: Find students with specific skills or expertise
- **Peer-to-Peer Learning**: Connect with classmates for study groups and academic help
- **Pocket-Money**: User trade their experiences and skills to gain money 

### 🔗 MarketPlace
- **Sell Your Product**: Maximise your product's last value through selling it
- **Category Organization**: Product categorized for easy research
- **Saving Option**: Save interested products for easy research in future

## 🚀 Technology Stack
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) with custom theming
- **Backend**: Firebase (Firestore, Authentication, Analytics)
- **State Management**: React Hooks
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Code Logic + Info

### 🚀 Technology Stack
**Frontend**: React 19 with TypeScript
**UI Framework**: Material-UI (MUI) with custom theming
**Backend**: Firebase (Firestore, Authentication, Analytics)
**State Management**: React Hooks
**Routing**: React Router DOM
**Build Tool**: Vite

### 🧭 Architecture Overview
**App Shell**: App wraps the app with AuthProvider and NotificationProvider, then renders MainApp.
**Sectioned UI**: MainApp swaps four sections (Forum, Reviews, Connect, Resources) via tabs; content renders through a TabPanel.
**Responsive Nav**: Top tabs on desktop; fixed bottom tabs on mobile.
**Theme System**: Single MUI theme (monochrome) with component overrides for AppBar, Tabs, Container, Card.

### 📦 Core Modules
**ForumSection / ReviewSection / ConnectionSection / ResourceSection**: Lazy-swappable feature modules; each can accept highlightedPostId to focus content.
**Auth Components**: Login, Signup, UserProfile handle auth dialogs, profile menu, and account actions.
**Notifications**: NotificationProvider exposes unreadCount; bell icon shows a badge.

### 🔐 Authentication & Identity
**Auth Source**: Firebase Authentication (email/password, optionally OAuth).
**Identity Display**: getDisplayName() derives a friendly name; Avatar initial computed by getAvatarLetter().
**Access Control**: Auth state toggles UI (login/signup vs. profile/avatar); sections can read currentUser for gated features.

### 🔔 Cross-Section Navigation
**Deep Link Event**: Listens to a custom DOM event navigateToPost with { section, postId }.
**Section Map**: 'forum' → 0, 'reviews' → 1, 'connection' → 2, 'resources' → 3.
**Highlighting**: Sets highlightedPostId for the active section and clears it after 5 seconds.

### 🧩 UI/UX Behavior
**Accessibility**: Tabs/TabPanels wired with aria-controls, role="tabpanel", and a11yProps.
**Mobile Spacing**: Main container adds bottom margin so content isn’t hidden behind the fixed bottom tab bar.
**Visual Language**: Clean, monochrome palette; rounded cards; subtle shadows.

### 🗄️ Data Model (Firestore suggested)
**Profiles**: profiles/{uid} → { name, major, year, hobbies, skills[], pricePerHour, contactPhone, contactVisible, ratingAvg, ratingCount }.
**Profile Reviews**: profiles/{uid}/reviews/{reviewId} → { rating, comment, reviewerId, reviewerName, createdAt }.
**Forum/Reviews/Resources**: Each section maintains its own collection(s) (e.g., posts, ratings, links) with created/updated timestamps and author IDs.
**Notifications**: notifications/{uid}/{notifId} → { type, section, postId, read, createdAt }.

### 🔎 Search & Discovery
**Keyword Search (Forum)**: Client queries Firestore with indexed fields (title/body/tags).
**Related Content**: When a keyword matches, show related posts (same tags/keywords).
**Ranking**: Combine recency + engagement (comments/upvotes) for result ordering.

### 🔗 Connect (Profiles & Paid Help)
**Create/Edit Profile**: Authenticated users can create/update their profile card.
**Contact Visibility**: contactVisible toggles whether phone/email is shown; default hidden for privacy.
**Ratings & Comments**: Users can rate and leave comments on other profiles; aggregates update ratingAvg/ratingCount.
**Browsing**: Grid/list of profiles with filters (major, skills, price range, rating).

### 🧠 State Management
**Local Component State**: React hooks (useState, useEffect) for UI state (dialogs, current tab, highlight).
**Context State**: Auth and notifications via providers; sections subscribe as needed.

### 🧭 Routing (if enabled)
**Tab ↔ Route Sync**: Map each tab to a route (/forum, /reviews, /connect, /resources) using React Router; persist selected tab via URL.
**Deep Links**: Support /:section/:id to open a specific post/profile and trigger highlighting.

### 🧪 Analytics & Telemetry
**Firebase Analytics**: Log page views (tab switches), search queries (anonymized), and engagement (post created, review left).
**KPIs**: Time-to-first-answer (forum), profile contact conversions, rating volume, resource click-through.

### 🔐 Security & Privacy
**Rules**: Firestore Security Rules enforce read/write by auth state and document ownership; reviews can’t be edited by the reviewee.
**PII**: Mask contact by default; optional “request contact” workflow.
**Abuse Controls**: Rate-limit posting/reviews; allow report/flag actions.

### 🧰 Build & Dev
**Vite**: Fast dev server and TS build.
**Env Config**: API keys/secrets in .env with Vite’s import.meta.env.
**Code Quality**: ESLint + Prettier recommended; strict TS for component props.

### ⚠️ Known Gaps / Next Steps
**Router Integration**: Currently tabs are state-only; add React Router for shareable links.
**Notifications UI**: Bell and avatar open the same menu—split into distinct popovers.
**Mobile Overflow Menu**: Menu/MenuItem and mobileMenuAnchor are present but unused—implement or remove.
**Search Indexing**: For scalable search, consider Firestore + Algolia (or Meilisearch) for full-text indexes.



## 🛠️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd 24-7
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - The app is pre-configured with Firebase
   - Database collections will be created automatically on first use

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Usage

1. **Navigate** between sections using the top navigation tabs
2. **Create Content**: Use the floating action buttons or "Add" buttons to contribute
3. **Search & Filter**: Use the search and filter options to find specific content
4. **Interact**: Like posts, bookmark resources, and connect with other students

## 🎨 Design Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with Material Design principles
- **Color-coded Categories**: Each section has its own color theme for easy navigation
- **Real-time Updates**: Live data updates using Firebase real-time capabilities

## 🔒 Privacy & Safety

- **Anonymous Options**: Students can choose to post anonymously
- **No Registration Required**: Easy access without complex signup processes
- **Community Guidelines**: Built-in moderation features for safe interactions

## 🌐 Firebase Collections

The app automatically creates these Firestore collections:

- `forumPosts`: Forum discussions and Q&A
- `facilityReviews`: Campus facility ratings and reviews
- `studentProfiles`: Student profiles and tutoring services
- `resources`: Useful links and resources

## 🤝 Contributing

This is a community-driven platform. Students can contribute by:

- Adding new forum discussions
- Rating campus facilities
- Creating student profiles
- Sharing useful resources
- Providing feedback for improvements

## 📄 License

This project is open-source and available for educational use.
