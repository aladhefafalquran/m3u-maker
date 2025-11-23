import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Library, Save, Trash2, Play, Calendar, Pencil, Check, X, GripVertical } from 'lucide-react';
import type { PlaylistItem } from '../types';
import { formatTime } from '../utils/format';

export interface SavedPlaylist {
    id: string;
    name: string;
    items: PlaylistItem[];
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
}

interface PlaylistLibraryProps {
    savedPlaylists: SavedPlaylist[];
    onLoadPlaylist: (playlist: SavedPlaylist) => void;
    onDeletePlaylist: (id: string) => void;
    onRenamePlaylist: (id: string, newName: string) => void;
    onSaveCurrent: () => void;

    currentPlaylistCount: number;
    // Selection props
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onDeleteSelected: () => void;
    // Recycle bin props
    deletedCount: number;
    onOpenRecycleBin: () => void;
}

interface DraggablePlaylistItemProps {
    playlist: SavedPlaylist;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onLoadPlaylist: (playlist: SavedPlaylist) => void;
    onDeletePlaylist: (id: string) => void;
    onRenamePlaylist: (id: string, newName: string) => void;
    editingId: string | null;
    startEditing: (playlist: SavedPlaylist) => void;
    saveEditing: (id: string) => void;
    cancelEditing: () => void;
    editName: string;
    setEditName: (name: string) => void;
    handleKeyDown: (e: React.KeyboardEvent, id: string) => void;
    editInputRef: React.RefObject<HTMLInputElement | null>;
}

const DraggablePlaylistItem = ({
    playlist,
    selectedIds,
    onToggleSelect,
    onLoadPlaylist,
    onDeletePlaylist,
    editingId,
    startEditing,
    saveEditing,
    cancelEditing,
    editName,
    setEditName,
    handleKeyDown,
    editInputRef
}: DraggablePlaylistItemProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `playlist-${playlist.id}`,
        data: {
            type: 'playlist',
            playlist
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : undefined,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group p-4 border rounded-xl transition-all ${selectedIds.has(playlist.id)
                ? 'bg-blue-500/5 border-blue-500/30'
                : 'bg-neutral-800/50 hover:bg-neutral-800 border-neutral-700/50 hover:border-neutral-600'
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                    <div className="flex flex-col gap-2 mt-1">
                        <button
                            onClick={() => onToggleSelect(playlist.id)}
                            className={`
                w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                ${selectedIds.has(playlist.id)
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-neutral-600 bg-transparent group-hover:border-neutral-500'
                                }
              `}
                        >
                            {selectedIds.has(playlist.id) && <Check size={12} className="text-white" />}
                        </button>
                        <button
                            {...listeners}
                            {...attributes}
                            className="text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing"
                        >
                            <GripVertical size={16} />
                        </button>
                    </div>

                    <div className="flex-1 min-w-0">
                        {editingId === playlist.id ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, playlist.id)}
                                    onBlur={() => saveEditing(playlist.id)}
                                    className="bg-neutral-900 text-white px-2 py-1 rounded border border-blue-500 outline-none text-sm font-semibold w-full"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); saveEditing(playlist.id); }}
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                    className="text-neutral-500 hover:text-neutral-300 p-1"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/title">
                                <h3 className="font-semibold text-white text-lg truncate">{playlist.name}</h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); startEditing(playlist); }}
                                    className="text-neutral-500 hover:text-white opacity-0 group-hover/title:opacity-100 transition-opacity p-1"
                                    title="Rename"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(playlist.updatedAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{(playlist.items || []).length} tracks</span>
                            <span>•</span>
                            <span>{formatTime((playlist.items || []).reduce((acc, item) => acc + (item.duration || 0), 0))}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onLoadPlaylist(playlist); }}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        title="Load Playlist"
                    >
                        <Play size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeletePlaylist(playlist.id); }}
                        className="p-2 bg-neutral-700 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 rounded-lg transition-colors"
                        title="Delete Playlist"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="flex gap-1 overflow-hidden h-1 rounded-full bg-neutral-700/50">
                {(playlist.items || []).slice(0, 5).map((_, i) => (
                    <div
                        key={i}
                        className="h-full bg-neutral-600"
                        style={{ width: `${100 / Math.min((playlist.items || []).length, 5)}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

export const PlaylistLibrary: React.FC<PlaylistLibraryProps> = ({
    savedPlaylists,
    onLoadPlaylist,
    onDeletePlaylist,
    onRenamePlaylist,
    onSaveCurrent,

    currentPlaylistCount,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onDeleteSelected,
    deletedCount,
    onOpenRecycleBin,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingId]);

    const startEditing = (playlist: SavedPlaylist) => {
        setEditingId(playlist.id);
        setEditName(playlist.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEditing = (id: string) => {
        if (editName.trim()) {
            onRenamePlaylist(id, editName.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            saveEditing(id);
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    return (
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Library size={20} className="text-emerald-400" />
                        Your Library
                    </h2>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenRecycleBin}
                            className={`relative p-2 rounded-lg transition-colors ${deletedCount > 0
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                                }`}
                            title="Recycle Bin"
                        >
                            <Trash2 size={20} />
                            {deletedCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                    {deletedCount}
                                </span>
                            )}
                        </button>
                        <div className="h-6 w-px bg-neutral-800 mx-1" />
                        <button
                            onClick={onSaveCurrent}
                            disabled={currentPlaylistCount === 0}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Save size={16} />
                            Save Current
                        </button>
                    </div>
                </div>

                {/* Selection Toolbar */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSelectAll}
                        className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        {savedPlaylists.length > 0 && selectedIds.size === savedPlaylists.length ? 'Unselect All' : 'Select All'}
                    </button>

                    {selectedIds.size > 0 && (
                        <button
                            onClick={onDeleteSelected}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {savedPlaylists.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg p-8">
                        <Library size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Library is empty</p>
                        <p className="text-sm mt-1">Save your playlists to access them later</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {savedPlaylists
                            .filter(playlist => playlist && playlist.id)
                            .map((playlist) => (
                                <DraggablePlaylistItem
                                    key={playlist.id}
                                    playlist={playlist}
                                    selectedIds={selectedIds}
                                    onToggleSelect={onToggleSelect}
                                    onLoadPlaylist={onLoadPlaylist}
                                    onDeletePlaylist={onDeletePlaylist}
                                    onRenamePlaylist={onRenamePlaylist}
                                    editingId={editingId}
                                    startEditing={startEditing}
                                    saveEditing={saveEditing}
                                    cancelEditing={cancelEditing}
                                    editName={editName}
                                    setEditName={setEditName}
                                    handleKeyDown={handleKeyDown}
                                    editInputRef={editInputRef}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};
