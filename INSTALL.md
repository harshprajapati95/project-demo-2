# EduHub Installation & Setup Guide

## Quick Start

1. **Download/Clone the Project**
   ```
   Download all files to your desired directory (e.g., d:\college2)
   ```

2. **Open the Website**
   - Double-click on `index.html` to open in your default browser
   - Or right-click → "Open with" → Choose your preferred browser

3. **For Local Development**
   - Use a local server for better performance (optional)
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve .`
   - VS Code: Use Live Server extension

## File Structure

```
college2/
├── index.html          # Main homepage
├── 404.html           # Error page
├── manifest.json      # PWA manifest
├── sw.js             # Service worker for offline support
├── config.json       # Configuration settings
├── README.md         # Documentation
├── INSTALL.md        # This installation guide
├── css/
│   └── style.css     # Main stylesheet
└── js/
    └── script.js     # JavaScript functionality
```

## Browser Requirements

### Minimum Requirements:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Recommended:
- Chrome (latest version)
- Good internet connection for Font Awesome icons

## Features Setup

### 1. Offline Support
- The service worker (`sw.js`) enables offline browsing
- Files are automatically cached on first visit
- Works without internet after initial load

### 2. Mobile App-like Experience
- Add to home screen on mobile devices
- Standalone app experience
- Push notifications ready (not implemented yet)

### 3. Content Management
- Edit `js/script.js` to modify subject data
- Update `subjectsData` object to add/remove content
- Change styling in `css/style.css`

## Customization Guide

### Adding New Subjects

1. **Open `js/script.js`**
2. **Find the `subjectsData` object**
3. **Add your new subject:**

```javascript
'your-subject': {
    title: 'Your Subject Name',
    'teacher-notes': [
        {
            title: 'Note Title',
            description: 'Note description',
            type: 'PDF',
            size: '1.2 MB',
            date: '2025-01-01'
        }
    ],
    // ... other content types
}
```

4. **Add subject card to HTML:**

```html
<div class="subject-card" onclick="openSubject('your-subject')">
    <div class="subject-icon">
        <i class="fas fa-your-icon"></i>
    </div>
    <h3>Your Subject</h3>
    <p>Subject description</p>
</div>
```

### Changing Colors/Theme

1. **Open `css/style.css`**
2. **Modify CSS custom properties or colors directly**
3. **Main colors to change:**
   - Background: `#000000`
   - Text: `#ffffff`
   - Accents: `#333333`, `#cccccc`

### Adding New Content Types

1. **Update tab buttons in `index.html`**
2. **Add data structure in `js/script.js`**
3. **Update `showTab()` function**

## Deployment Options

### 1. GitHub Pages
1. Upload files to GitHub repository
2. Enable GitHub Pages in repository settings
3. Access via `https://username.github.io/repository-name`

### 2. Netlify
1. Drag and drop folder to Netlify
2. Get instant deployment
3. Custom domain available

### 3. Traditional Web Hosting
1. Upload files via FTP/cPanel
2. Ensure proper file permissions
3. Point domain to the directory

### 4. Local Network Sharing
1. Use local server (XAMPP, WAMP, etc.)
2. Access via local IP address
3. Share with devices on same network

## Troubleshooting

### Common Issues:

1. **Icons not loading**
   - Check internet connection
   - Font Awesome CDN may be blocked
   - Download and host icons locally if needed

2. **Service Worker not registering**
   - Serve over HTTPS or localhost
   - Check browser console for errors
   - Clear browser cache

3. **Mobile menu not working**
   - Ensure JavaScript is enabled
   - Check for console errors
   - Verify file paths are correct

4. **Styles not loading**
   - Check file path in HTML
   - Ensure CSS file exists
   - Clear browser cache

### Performance Tips:

1. **Optimize Images** (if added later)
   - Use WebP format when possible
   - Compress images
   - Use appropriate sizes

2. **Minimize HTTP Requests**
   - Combine CSS files if multiple
   - Use CSS sprites for icons
   - Enable gzip compression

3. **Browser Caching**
   - Set appropriate cache headers
   - Use versioning for assets
   - Service worker handles basic caching

## Advanced Configuration

### Environment Setup
1. **Modify `config.json`** for global settings
2. **Update manifest.json** for PWA customization
3. **Configure service worker** for caching strategy

### API Integration (Future)
- Add backend API endpoints in `js/script.js`
- Implement user authentication
- Add content upload functionality

### Database Integration (Future)
- Replace static data with dynamic content
- Add user progress tracking
- Implement search functionality

## Security Considerations

1. **File Upload** (if implemented)
   - Validate file types
   - Scan for malware
   - Limit file sizes

2. **User Input**
   - Sanitize all inputs
   - Prevent XSS attacks
   - Use HTTPS in production

## Support & Updates

### Getting Help:
- Check browser console for errors
- Verify all files are present
- Ensure proper file permissions

### Future Updates:
- Keep track of new features in README.md
- Update version number in manifest.json
- Clear browser cache after updates

---

**Happy Learning with EduHub! 🎓**
