import React from 'react';
import {
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { PlaylistItem } from '../types';
import { SortableTrack } from './SortableTrack';
import { Download, ListMusic, FolderDown, Upload, Pencil, Check } from 'lucide-react';
import { formatTime, generateId } from '../utils/format';
import { parseM3U } from '../utils/m3uParser';
import type { AudioTrack } from '../types';

interface PlaylistBuilderProps {
    playlist: PlaylistItem[];
    setPlaylist: React.Dispatch<React.SetStateAction<PlaylistItem[]>>;
    onDownloadM3U: () => void;
    onDownloadAllFiles: () => void;
    availableTracks: AudioTrack[];
    playlistName: string;
    onUpdateName: (name: string) => void;
    insertionIndex: number | null;
}

export const PlaylistBuilder: React.FC<PlaylistBuilderProps> = ({
    playlist,
    setPlaylist,
    onDownloadM3U,
    onDownloadAllFiles,
    availableTracks,
    playlistName,
    onUpdateName,
    insertionIndex,
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState(playlistName);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName]);

    const handleNameSubmit = () => {
        if (tempName.trim()) {
            onUpdateName(tempName.trim());
        } else {
            setTempName(playlistName);
        }
        setIsEditingName(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            setTempName(playlistName);
            setIsEditingName(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const filenames = parseM3U(text);

        let addedCount = 0;
        let notFoundCount = 0;

        const newItems: PlaylistItem[] = [];

        filenames.forEach(filename => {
            // Try to find a matching track in available tracks
            // We match loosely by checking if the available track name contains the m3u filename or vice versa
            // or exact match on filename
            const match = availableTracks.find(t =>
                t.name === filename ||
                t.path === filename ||
                t.file.name === filename
            );

            if (match) {
                newItems.push({
                    ...match,
                    playlistId: generateId()
                });
                addedCount++;
            } else {
                notFoundCount++;
            }
        });

        if (newItems.length > 0) {
            setPlaylist(prev => [...prev, ...newItems]);
            alert(`Imported ${addedCount} tracks.${notFoundCount > 0 ? ` ${notFoundCount} tracks could not be found in your uploaded files.` : ''}`);
        } else {
            alert('No matching tracks found. Make sure you have uploaded the audio files first.');
        }

        // Reset input
        if (event.target.value) event.target.value = '';
    };
    const { setNodeRef } = useDroppable({
        id: 'playlist-droppable',
    });

    const handleRemove = (id: string) => {
        setPlaylist((items) => items.filter((item) => item.playlistId !== id));
    };

    // Calculate total duration
    const totalDuration = playlist.reduce((sum, item) => sum + (item.duration || 0), 0);

    const [showPathModal, setShowPathModal] = React.useState(false);
    const [basePath, setBasePath] = React.useState('');

    const handleDownloadClick = () => {
        setShowPathModal(true);
    };

    const confirmDownload = () => {
        onDownloadM3U(basePath);
        setShowPathModal(false);
    };

    return (
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 overflow-hidden flex flex-col h-full relative">
            {showPathModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">Download M3U</h3>
                        <p className="text-sm text-neutral-400 mb-4">
                            Optionally add a base path prefix for your files (e.g. <code className="bg-neutral-800 px-1 rounded">C:\Music\</code>). Leave empty for filenames only.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-neutral-500 uppercase mb-1 block">Base Path Prefix</label>
                                <input
                                    type="text"
                                    value={basePath}
                                    onChange={(e) => setBasePath(e.target.value)}
                                    placeholder="e.g. /home/user/music/"
                                    className="w-full bg-neutral-800 text-white px-3 py-2 rounded-lg border border-neutral-700 focus:border-blue-500 outline-none text-sm"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPathModal(false)}
                                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDownload}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                    <ListMusic size={20} className="text-purple-400" />

                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleNameSubmit}
                                onKeyDown={handleKeyDown}
                                className="bg-neutral-800 text-white px-2 py-1 rounded border border-blue-500 outline-none text-lg font-semibold w-48"
                            />
                            <button
                                onClick={handleNameSubmit}
                                className="text-blue-400 hover:text-blue-300"
                            >
                                <Check size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <h2 className="text-lg font-semibold text-white">
                                {playlistName}
                            </h2>
                            <button
                                onClick={() => {
                                    setTempName(playlistName);
                                    setIsEditingName(true);
                                }}
                                className="text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Rename playlist"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                            {playlist.length} tracks
                        </span>
                        {totalDuration > 0 && (
                            <span className="text-xs font-normal text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded-full">
                                {formatTime(totalDuration)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".m3u,.m3u8"
                        className="hidden"
                    />
                    <button
                        onClick={handleImportClick}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700"
                        title="Import M3U Playlist"
                    >
                        <Upload size={16} />
                        Import
                    </button>
                    <button
                        onClick={onDownloadAllFiles}
                        disabled={playlist.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Download all audio files"
                    >
                        <FolderDown size={16} />
                        Download Files
                    </button>

                    <button
                        onClick={handleDownloadClick}
                        disabled={playlist.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        Download M3U
                    </button>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {playlist.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg p-8">
                        <ListMusic size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Your playlist is empty</p>
                        <p className="text-sm mt-1">Drag tracks here or click + to add</p>
                    </div>
                ) : (
                    <SortableContext
                        items={playlist.map(p => `playlist-item-${p.playlistId}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {playlist.map((item, index) => (
                                <React.Fragment key={item.playlistId}>
                                    {insertionIndex === index && (
                                        <div className="h-16 border-2 border-dashed border-blue-500/50 rounded-lg bg-blue-500/10 flex items-center justify-center animate-pulse">
                                            <span className="text-blue-400 font-medium">Drop here to insert</span>
                                        </div>
                                    )}
                                    <SortableTrack
                                        item={item}
                                        onRemove={handleRemove}
                                    />
                                </React.Fragment>
                            ))}
                            {insertionIndex === playlist.length && (
                                <div className="h-16 border-2 border-dashed border-blue-500/50 rounded-lg bg-blue-500/10 flex items-center justify-center animate-pulse">
                                    <span className="text-blue-400 font-medium">Drop here to insert</span>
                                </div>
                            )}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
};
