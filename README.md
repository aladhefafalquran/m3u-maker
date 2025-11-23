# M3U Playlist Maker

A modern, feature-rich web application for creating and managing M3U playlists with an intuitive drag-and-drop interface.

## Features

### 🎵 Playlist Management
- **Drag & Drop**: Easily add tracks to your playlist by dragging from the track library
- **Reorder Tracks**: Rearrange tracks within your playlist using drag-and-drop
- **Bulk Operations**: Select multiple tracks for batch operations
- **Track Information**: View duration, file name, and other metadata for each track

### 📚 Library System
- **Save Playlists**: Save your playlists to the library for later use
- **Load Playlists**: Quickly load saved playlists
- **Rename Playlists**: Edit playlist names inline
- **Drag Playlists**: Drag entire playlists from the library to add all tracks at once
- **Playlist Metadata**: View track count, total duration, and creation date

### 🗑️ Recycle Bin
- **Track Recycle Bin**: Deleted tracks are moved to a recycle bin instead of being permanently deleted
- **Playlist Recycle Bin**: Deleted playlists can be restored from the recycle bin
- **Bulk Restore**: Restore multiple items at once
- **Permanent Delete**: Permanently delete items when needed
- **Auto-Cleanup**: Tracks deleted for more than 30 days are automatically removed

### 💾 Data Persistence
- **IndexedDB Storage**: Tracks and current playlist are stored in IndexedDB
- **LocalStorage**: Playlist library is stored in localStorage
- **Auto-Save**: Changes are automatically saved
- **Duration Caching**: Audio file durations are cached for better performance

### 📤 Export Options
- **M3U Export**: Download playlists as standard M3U files
- **Batch Download**: Download all audio files in a playlist as a ZIP archive

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd m3u-maker

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **dnd-kit** - Drag and drop functionality
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling
- **IndexedDB** - Client-side database for tracks
- **LocalStorage** - Playlist library storage
- **JSZip** - ZIP file generation for batch downloads

## Project Structure

```
src/
├── components/
│   ├── FileUploader.tsx       # File upload component
│   ├── TrackList.tsx          # Track library display
│   ├── PlaylistBuilder.tsx    # Main playlist editor
│   ├── PlaylistLibrary.tsx    # Saved playlists library
│   ├── PlaylistRecycleBin.tsx # Deleted playlists management
│   └── RecycleBin.tsx         # Deleted tracks management
├── utils/
│   ├── storage.ts             # IndexedDB operations
│   ├── m3uGenerator.ts        # M3U file generation
│   ├── audioExport.ts         # ZIP export functionality
│   ├── audioDuration.ts       # Audio duration extraction
│   └── format.ts              # Formatting utilities
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Main application component
└── main.tsx                   # Application entry point
```

## Usage

1. **Upload Audio Files**: Click the upload area or drag files to add them to your track library
2. **Create Playlist**: Drag tracks from the library to the playlist builder
3. **Reorder Tracks**: Drag tracks within the playlist to reorder them
4. **Save Playlist**: Click "Save to Library" to save your playlist
5. **Export**: Download as M3U file or download all audio files as ZIP

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

**Note**: IndexedDB and modern JavaScript features are required.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
