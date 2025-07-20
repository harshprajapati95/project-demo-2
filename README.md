# 🎓 EduHub - Educational File Management System

A modern web application for students to organize and access educational materials by semester and subject.

## 📁 Project Structure

```
eduhub/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── server/                # Backend server
│   ├── server.js          # Main server file
│   ├── package.json       # Server dependencies
│   ├── .env               # Environment variables
│   ├── data.json          # JSON fallback storage
│   └── uploads/           # Uploaded files
├── package.json           # Main project file
└── README.md              # This file
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm run install-deps
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Open in Browser**
   ```
   http://localhost:5000
   ```

## 🔧 Features

- ✅ File upload and management
- ✅ Semester and subject organization
- ✅ MongoDB database storage
- ✅ JSON fallback for offline use
- ✅ Progressive Web App (PWA)
- ✅ Responsive design
- ✅ Delete functionality
- ✅ Multiple file formats support

## 🗄️ Database

- **Primary**: MongoDB (automatic fallback to JSON)
- **Connection**: `mongodb://localhost:27017/eduhub`
- **Collections**: `contents` (file metadata) 
  - Teacher Notes
  - Student Notes
  - Educational Resources
  - Assignments
  - Previous Year Questions (PYQs)
  - Syllabus
- **Interactive Navigation**: Smooth scrolling and mobile-friendly navigation
- **Modal System**: Detailed subject content displayed in elegant modals
- **Search Functionality**: Easy content discovery
- **Download System**: Downloadable resources for offline access

## Subjects Included

1. **Mathematics** - Calculus, Algebra, Statistics
2. **Physics** - Mechanics, Thermodynamics, Optics
3. **Chemistry** - Organic, Inorganic, Physical
4. **Computer Science** - Programming, Data Structures, Algorithms
5. **English** - Literature, Grammar, Composition
6. **Biology** - Botany, Zoology, Genetics

## File Structure

```
college2/
├── index.html          # Main homepage
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   └── script.js       # JavaScript functionality
└── README.md           # This file
```

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Advanced styling with Flexbox and Grid
- **JavaScript**: Interactive functionality and dynamic content
- **Font Awesome**: Icons for better visual appeal
- **Google Fonts**: Clean typography

## Getting Started

1. Clone or download the project files
2. Open `index.html` in a web browser
3. Navigate through different subjects and content types
4. Use the responsive navigation for mobile devices

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Adding New Subjects

To add a new subject, update the `subjectsData` object in `js/script.js`:

```javascript
'new-subject': {
    title: 'New Subject',
    'teacher-notes': [...],
    'student-notes': [...],
    // ... other content types
}
```

### Modifying Styles

Edit `css/style.css` to customize:
- Colors and themes
- Layout and spacing
- Typography
- Responsive breakpoints

### Adding New Content Types

To add new content categories:
1. Update the modal tabs in `index.html`
2. Add corresponding data structure in `script.js`
3. Update the tab switching functionality

## Future Enhancements

- User authentication system
- Content upload functionality
- Advanced search and filtering
- Progress tracking
- Discussion forums
- Calendar integration
- Offline access with service workers

## Contributing

Feel free to contribute by:
- Adding more subjects
- Improving the UI/UX
- Adding new features
- Fixing bugs
- Optimizing performance

## License

This project is open source and available under the MIT License.

## Contact

For questions or suggestions, please contact the development team.

---

**EduHub** - Making education accessible and organized.
