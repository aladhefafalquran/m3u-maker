import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { FileUploader } from './components/FileUploader';
import { TrackList } from './components/TrackList';
import { PlaylistBuilder } from './components/PlaylistBuilder';
import { RecycleBin } from './components/RecycleBin';
import { PlaylistLibrary, type SavedPlaylist } from './components/PlaylistLibrary';
import { PlaylistRecycleBin } from './components/PlaylistRecycleBin';
import type { AudioTrack, PlaylistItem } from './types';
import { generateId } from './utils/format';
import { generateM3U, downloadM3U } from './utils/m3uGenerator';
import {
  Music2,
} from 'lucide-react';
import { saveTracks, getTracksFromDB, savePlaylist as savePlaylistToDB, getPlaylist } from './utils/storage';
import { downloadAllAudioFiles } from './utils/audioExport';
import { getAudioDuration } from './utils/audioDuration';

function App() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [activeTab, setActiveTab] = useState<'tracks' | 'library'>('tracks');

  const [pendingSave, setPendingSave] = useState<SavedPlaylist | null>(null);

  // Playlist Library Selection & Bin State
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set());
  const [showPlaylistRecycleBin, setShowPlaylistRecycleBin] = useState(false);

  // Delayed Drop Spacer State
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const dragOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOverIdRef = useRef<string | null>(null);

  const activeTracks = tracks.filter(t => !t.deletedAt);
  const deletedTracks = tracks.filter(t => t.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  const activePlaylists = savedPlaylists.filter(p => !p.deletedAt);
  const deletedPlaylists = savedPlaylists.filter(p => p.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTracks = await getTracksFromDB();
        const savedPlaylist = await getPlaylist();

        // Fix missing durations for existing tracks
        const tracksWithDuration = await Promise.all(savedTracks.map(async (track) => {
          if (!track.duration || track.duration === 0) {
            try {
              const duration = await getAudioDuration(track.file);
              return { ...track, duration };
            } catch (e) {
              return track;
            }
          }
          return track;
        }));

        // Fix missing durations for playlist items
        const playlistWithDuration = await Promise.all(savedPlaylist.map(async (item) => {
          if (!item.duration || item.duration === 0) {
            try {
              const duration = await getAudioDuration(item.file);
              return { ...item, duration };
            } catch (e) {
              return item;
            }
          }
          return item;
        }));

        // Auto-cleanup: Remove tracks deleted more than 30 days ago
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const cleanedTracks = tracksWithDuration.filter(track => {
          if (track.deletedAt && track.deletedAt < thirtyDaysAgo) {
            return false; // Remove permanently
          }
          return true;
        });

        // Load saved playlists from localStorage
        const library = localStorage.getItem('playlist_library');
        if (library) {
          setSavedPlaylists(JSON.parse(library));
        }

        setTracks(cleanedTracks);
        setPlaylist(playlistWithDuration);

        // Save back to DB to persist the fixes and cleanup
        await saveTracks(cleanedTracks);
        await savePlaylistToDB(playlistWithDuration);
      } catch (error) {
        console.error('Failed to load data from IndexedDB:', error);
      }
    };
    loadData();
  }, []);

  // Save tracks to IndexedDB whenever they change
  useEffect(() => {
    if (tracks.length > 0) {
      saveTracks(tracks).catch(error => {
        console.error('Failed to save tracks:', error);
      });
    }
  }, [tracks]);

  // Save playlist to IndexedDB whenever it changes
  useEffect(() => {
    savePlaylistToDB(playlist).catch(error => {
      console.error('Failed to save playlist:', error);
    });
  }, [playlist]);

  const handleFilesSelected = async (files: File[]) => {
    const newTracksPromises = files.map(async (file) => {
      let duration = 0;
      try {
        duration = await getAudioDuration(file);
      } catch (error) {
        console.error(`Failed to get duration for ${file.name}:`, error);
      }

      return {
        id: generateId(),
        file,
        name: file.name.replace(/\.[^/.]+$/, ""),
        path: file.name,
        duration
      };
    });

    const newTracks = await Promise.all(newTracksPromises);
    setTracks(prev => [...prev, ...newTracks]);
  };

  const handleAddToPlaylist = (track: AudioTrack) => {
    const newItem: PlaylistItem = {
      ...track,
      playlistId: generateId()
    };
    setPlaylist(prev => [...prev, newItem]);
  };

  const handleDownloadM3U = (basePath?: string) => {
    const content = generateM3U(playlist, basePath);
    downloadM3U(content, `${playlistName}.m3u`);
  };

  const handleDownloadAllFiles = async () => {
    await downloadAllAudioFiles(playlist);
  };

  const handleSaveToLibrary = () => {
    const newPlaylist: SavedPlaylist = {
      id: generateId(),
      name: playlistName,
      items: playlist,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const existingIndex = savedPlaylists.findIndex(p => p.name === newPlaylist.name);

    if (existingIndex >= 0) {
      setPendingSave(newPlaylist);
      return;
    }

    savePlaylistToLibrary(newPlaylist);
  };

  const savePlaylistToLibrary = (playlistToSave: SavedPlaylist, overwrite = false) => {
    let newLibrary: SavedPlaylist[];

    if (overwrite) {
      newLibrary = savedPlaylists.map(p =>
        p.name === playlistToSave.name ? { ...playlistToSave, id: p.id, createdAt: p.createdAt } : p
      );
    } else {
      newLibrary = [playlistToSave, ...savedPlaylists];
    }

    setSavedPlaylists(newLibrary);
    localStorage.setItem('playlist_library', JSON.stringify(newLibrary));
    setPendingSave(null);
    alert('Playlist saved to library!');
  };

  const handleRenamePlaylist = (id: string, newName: string) => {
    // Check if name exists (excluding the current playlist being renamed)
    if (savedPlaylists.some(p => p.id !== id && p.name === newName)) {
      alert(`A playlist named "${newName}" already exists.`);
      return;
    }

    const newLibrary = savedPlaylists.map(p =>
      p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p
    );

    setSavedPlaylists(newLibrary);
    localStorage.setItem('playlist_library', JSON.stringify(newLibrary));

    // If we renamed the currently loaded playlist, update the name in the builder too
    const savedPlaylist = savedPlaylists.find(p => p.id === id);
    if (savedPlaylist) {
      setPlaylist(savedPlaylist.items);
      setPlaylistName(savedPlaylist.name);
    }
  };

  const handleOverwrite = () => {
    if (pendingSave) {
      savePlaylistToLibrary(pendingSave, true);
    }
  };

  const handleSaveAsNew = () => {
    if (pendingSave) {
      let newName = pendingSave.name;
      let counter = 1;
      while (savedPlaylists.some(p => p.name === newName)) {
        newName = `${pendingSave.name} (${counter})`;
        counter++;
      }
      savePlaylistToLibrary({ ...pendingSave, name: newName });
    }
  };

  const handleLoadPlaylist = (saved: SavedPlaylist) => {
    if (playlist.length > 0) {
      if (!confirm('Loading a playlist will replace your current one. Continue?')) {
        return;
      }
    }
    setPlaylist(saved.items);
    setPlaylistName(saved.name);
    setActiveTab('tracks'); // Switch back to tracks view to see the loaded playlist content context
  };

  const handleDeletePlaylist = (id: string) => {
    if (confirm('Are you sure you want to move this playlist to the Recycle Bin?')) {
      const newLibrary = savedPlaylists.map(p =>
        p.id === id ? { ...p, deletedAt: Date.now() } : p
      );
      setSavedPlaylists(newLibrary);
      localStorage.setItem('playlist_library', JSON.stringify(newLibrary));

      // Remove from selection if selected
      if (selectedPlaylistIds.has(id)) {
        const newSelected = new Set(selectedPlaylistIds);
        newSelected.delete(id);
        setSelectedPlaylistIds(newSelected);
      }
    }
  };

  // Playlist Selection & Bin Handlers
  const handleTogglePlaylistSelect = (id: string) => {
    const newSelected = new Set(selectedPlaylistIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPlaylistIds(newSelected);
  };

  const handleSelectAllPlaylists = (ids?: string[]) => {
    // If ids are provided (e.g. empty array for unselect all), use them
    if (ids) {
      setSelectedPlaylistIds(new Set(ids));
      return;
    }

    // Default toggle behavior
    if (selectedPlaylistIds.size === activePlaylists.length) {
      setSelectedPlaylistIds(new Set());
    } else {
      setSelectedPlaylistIds(new Set(activePlaylists.map(p => p.id)));
    }
  };

  const handleDeleteSelectedPlaylists = () => {
    if (confirm(`Are you sure you want to move ${selectedPlaylistIds.size} playlists to the Recycle Bin?`)) {
      const now = Date.now();
      const newLibrary = savedPlaylists.map(p =>
        selectedPlaylistIds.has(p.id) ? { ...p, deletedAt: now } : p
      );
      setSavedPlaylists(newLibrary);
      localStorage.setItem('playlist_library', JSON.stringify(newLibrary));
      setSelectedPlaylistIds(new Set());
    }
  };

  const handleRestorePlaylists = (ids: string[]) => {
    const newLibrary = savedPlaylists.map(p =>
      ids.includes(p.id) ? { ...p, deletedAt: undefined } : p
    );
    setSavedPlaylists(newLibrary);
    localStorage.setItem('playlist_library', JSON.stringify(newLibrary));
  };

  const handlePermanentDeletePlaylists = (ids: string[]) => {
    const newLibrary = savedPlaylists.filter(p => !ids.includes(p.id));
    setSavedPlaylists(newLibrary);
    localStorage.setItem('playlist_library', JSON.stringify(newLibrary));
  };

  const handleToggleTrackSelect = (id: string) => {
    const newSelected = new Set(selectedTrackIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTrackIds(newSelected);
  };

  const handleSelectAllTracks = (ids: string[]) => {
    if (selectedTrackIds.size === ids.length && ids.every(id => selectedTrackIds.has(id))) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(ids));
    }
  };

  const handleDeleteTracks = (ids: string[]) => {
    const now = Date.now();
    setTracks(prev => prev.map(track => {
      if (ids.includes(track.id)) {
        return { ...track, deletedAt: now };
      }
      return track;
    }));

    // Also remove from playlist if present
    setPlaylist(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedTrackIds(new Set());
  };

  const handleRestoreTracks = (ids: string[]) => {
    setTracks(prev => prev.map(track => {
      if (ids.includes(track.id)) {
        const { deletedAt, ...rest } = track;
        return rest;
      }
      return track;
    }));
  };

  const handlePermanentDelete = (ids: string[]) => {
    setTracks(prev => prev.filter(track => !ids.includes(track.id)));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setInsertionIndex(null);
    lastOverIdRef.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    // Only apply logic if dragging a track/library item (not reordering playlist)
    if (!active.id.toString().startsWith('playlist-item-')) {
      if (!over) {
        if (dragOverTimerRef.current) {
          clearTimeout(dragOverTimerRef.current);
          dragOverTimerRef.current = null;
        }
        setInsertionIndex(null);
        lastOverIdRef.current = null;
        return;
      }

      // Check if over a playlist item
      if (over.id.toString().startsWith('playlist-item-')) {
        if (over.id !== lastOverIdRef.current) {
          // New item hovered, reset timer
          if (dragOverTimerRef.current) {
            clearTimeout(dragOverTimerRef.current);
          }
          lastOverIdRef.current = over.id as string;
          setInsertionIndex(null); // Hide spacer until timer fires

          dragOverTimerRef.current = setTimeout(() => {
            const overIdStr = over.id as string;
            const rawOverId = overIdStr.replace('playlist-item-', '');
            const overIndex = playlist.findIndex(p => p.playlistId === rawOverId);
            if (overIndex !== -1) {
              setInsertionIndex(overIndex);
            }
          }, 500); // 0.5 second delay
        }
      } else if (over.id === 'playlist-droppable') {
        // If over the container but not an item, maybe show at end immediately or after delay?
        // User asked for "between tracks", so let's stick to item hovering for the spacer.
        // We can clear the spacer if they move to empty space to avoid confusion.
        if (dragOverTimerRef.current) {
          clearTimeout(dragOverTimerRef.current);
          dragOverTimerRef.current = null;
        }
        setInsertionIndex(null);
        lastOverIdRef.current = null;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setInsertionIndex(null);
    if (dragOverTimerRef.current) {
      clearTimeout(dragOverTimerRef.current);
      dragOverTimerRef.current = null;
    }
    lastOverIdRef.current = null;

    if (!over) return;

    // Case 1: Reordering within playlist
    if (active.id.toString().startsWith('playlist-item-')) {
      if (active.id !== over.id) {
        setPlaylist((items) => {
          const activeIdStr = active.id as string;
          const overIdStr = over.id as string;
          const rawActiveId = activeIdStr.replace('playlist-item-', '');
          const rawOverId = overIdStr.replace('playlist-item-', '');

          const oldIndex = items.findIndex((item) => item.playlistId === rawActiveId);
          const newIndex = items.findIndex((item) => item.playlistId === rawOverId);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
      return;
    }

    // Case 2: Dragging from tracks/library to playlist
    // Check if dropped over the playlist container OR a specific playlist item
    const isOverPlaylist = over.id === 'playlist-droppable' || over.id.toString().startsWith('playlist-item-');

    if (isOverPlaylist) {
      const activeIdStr = active.id as string;
      let insertIndex = playlist.length; // Default to end

      // If dropped over a specific item, find its index to insert before/after
      if (insertionIndex !== null) {
        insertIndex = insertionIndex;
      } else if (over.id.toString().startsWith('playlist-item-')) {
        // Fallback if no spacer (e.g. dropped quickly), insert after or at end?
        // If user didn't wait for spacer, maybe just append?
        // Or keep original behavior: insert at index immediately?
        // The user said "if the user hold... it make a space".
        // Implies if they DON'T hold, it might not insert there?
        // But standard DnD usually allows immediate drop.
        // Let's keep immediate drop capability but maybe default to end if not hovered long enough?
        // "no it didnt work; how about to avoid any confusing..."
        // This suggests the previous immediate insertion was confusing.
        // So maybe ONLY insert at index if spacer is visible?
        // If spacer NOT visible, append to end?
        // Let's try: If insertionIndex is null, append to end (insertIndex = playlist.length).
        insertIndex = playlist.length;
      }

      const addTracksToPlaylist = (tracksToAdd: AudioTrack[]) => {
        const newItems: PlaylistItem[] = tracksToAdd.map(track => ({
          ...track,
          playlistId: generateId() // Ensure this generates a unique ID like 'playlist-item-' + uuid
        }));

        setPlaylist(prev => {
          const newPlaylist = [...prev];
          newPlaylist.splice(insertIndex, 0, ...newItems);
          return newPlaylist;
        });
      };

      // Handle Playlist Drop (from library)
      if (active.data.current?.type === 'playlist') {
        const playlistData = active.data.current.playlist as SavedPlaylist;
        addTracksToPlaylist(playlistData.items);
        return;
      }

      // Handle Track Drop
      const trackId = activeIdStr;

      // If the dragged item is part of the selection, add all selected items
      if (selectedTrackIds.has(trackId)) {
        const selectedTracks = Array.from(selectedTrackIds)
          .map(id => activeTracks.find(t => t.id === id))
          .filter((t): t is AudioTrack => t !== undefined);

        addTracksToPlaylist(selectedTracks);
      } else {
        // Otherwise just add the single dragged item
        const track = activeTracks.find(t => t.id === trackId);
        if (track) {
          addTracksToPlaylist([track]);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex items-center px-4 lg:px-8 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Music2 className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
              M3U Maker
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto lg:overflow-hidden">
          <div className="max-w-7xl mx-auto h-auto lg:h-full grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Upload & Track List / Library */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 h-[500px] lg:h-[calc(100vh-7rem)]">
              <div className="flex p-1 bg-neutral-900/50 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setActiveTab('tracks')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'tracks'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                >
                  Tracks
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'library'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                >
                  Library
                </button>
              </div>

              {activeTab === 'tracks' ? (
                <>
                  <div className="flex-none">
                    <FileUploader onFilesSelected={handleFilesSelected} />
                  </div>
                  <div className="flex-1 min-h-0">
                    <TrackList
                      tracks={activeTracks}
                      onAddToPlaylist={handleAddToPlaylist}
                      onDeleteTracks={handleDeleteTracks}
                      onOpenRecycleBin={() => setShowRecycleBin(true)}
                      deletedCount={deletedTracks.length}
                      selectedIds={selectedTrackIds}
                      onToggleSelect={handleToggleTrackSelect}
                      onSelectAll={handleSelectAllTracks}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 min-h-0">
                  <PlaylistLibrary
                    savedPlaylists={activePlaylists}
                    onLoadPlaylist={handleLoadPlaylist}
                    onDeletePlaylist={handleDeletePlaylist}
                    onRenamePlaylist={handleRenamePlaylist}
                    onSaveCurrent={handleSaveToLibrary}

                    currentPlaylistCount={playlist.length}
                    selectedIds={selectedPlaylistIds}
                    onToggleSelect={handleTogglePlaylistSelect}
                    onSelectAll={() => handleSelectAllPlaylists()}
                    onDeleteSelected={handleDeleteSelectedPlaylists}
                    deletedCount={deletedPlaylists.length}
                    onOpenRecycleBin={() => setShowPlaylistRecycleBin(true)}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Playlist Builder */}
            <div className="col-span-1 lg:col-span-8 h-[500px] lg:h-[calc(100vh-7rem)]">
              <PlaylistBuilder
                playlist={playlist}
                setPlaylist={setPlaylist}
                onDownloadM3U={handleDownloadM3U}
                onDownloadAllFiles={handleDownloadAllFiles}
                availableTracks={activeTracks}
                playlistName={playlistName}
                onUpdateName={setPlaylistName}
                insertionIndex={insertionIndex}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Save Conflict Modal */}
      {pendingSave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Playlist Already Exists</h3>
            <p className="text-neutral-400 mb-6">
              A playlist named "<span className="text-white font-medium">{pendingSave.name}</span>" already exists in your library.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleOverwrite}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Overwrite Existing
              </button>
              <button
                onClick={handleSaveAsNew}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Save as New
              </button>
              <button
                onClick={() => setPendingSave(null)}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recycle Bin Modal (Tracks) */}
      {showRecycleBin && (
        <RecycleBin
          deletedTracks={deletedTracks}
          onRestore={handleRestoreTracks}
          onPermanentDelete={handlePermanentDelete}
          onClose={() => setShowRecycleBin(false)}
        />
      )}

      {/* Recycle Bin Modal (Playlists) */}
      {showPlaylistRecycleBin && (
        <PlaylistRecycleBin
          deletedPlaylists={deletedPlaylists}
          onRestore={handleRestorePlaylists}
          onPermanentDelete={handlePermanentDeletePlaylists}
          onClose={() => setShowPlaylistRecycleBin(false)}
        />
      )}

      <DragOverlay>
        {activeId ? (
          <div className="p-3 bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl opacity-90">
            {activeId.toString().startsWith('playlist-') ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <Music2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    Add Playlist Tracks
                  </p>
                  <p className="text-xs text-neutral-500">
                    Drop to add all tracks
                  </p>
                </div>
              </div>
            ) : selectedTrackIds.has(activeId) && selectedTrackIds.size > 1 ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedTrackIds.size}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    Adding {selectedTrackIds.size} tracks
                  </p>
                  <p className="text-xs text-neutral-500">
                    Drop to add to playlist
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-neutral-200">
                {tracks.find(t => t.id === activeId)?.name || 'Track'}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
