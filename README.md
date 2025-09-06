# 24/7 Student Platform

A comprehensive web application designed to enhance student life with essential features for academic and social support.

## 🌟 Features

### 📚 Forum (论坛)
- **Question & Answer**: Students can post questions and get answers from peers
- **Ideas & Discussions**: Share innovative ideas and engage in meaningful discussions
- **Anonymous Posting**: Option to post anonymously for sensitive topics
- **Real-time Interactions**: Like posts, reply to discussions, and build community

### ⭐ 大众点评 (Campus Reviews)
- **Facility Ratings**: Rate and review toilets, canteens, and study spaces
- **Course & Professor Reviews**: Help fellow students choose the best courses and instructors
- **Real-time Occupancy**: Color-coded system showing facility traffic levels
- **Wait Time Tracking**: Know expected wait times before visiting busy locations

### 🤝 Connection (+ 知识付费)
- **Student Profiles**: Create detailed profiles with major, hobbies, and skills
- **Knowledge Marketplace**: Students can offer tutoring services for payment
- **Skill Matching**: Find students with specific skills or expertise
- **Peer-to-Peer Learning**: Connect with classmates for study groups and academic help

### 🔗 Resources
- **Essential Links**: Curated collection of useful websites (LinkedIn, GitHub, Khan Academy, etc.)
- **Category Organization**: Resources organized by Career, Academic, Programming, Health, etc.
- **Community Contributions**: Students can add and recommend new resources
- **Bookmark System**: Save frequently used resources for quick access

## 🚀 Technology Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) with custom theming
- **Backend**: Firebase (Firestore, Authentication, Analytics)
- **State Management**: React Hooks
- **Routing**: React Router DOM
- **Build Tool**: Vite

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
