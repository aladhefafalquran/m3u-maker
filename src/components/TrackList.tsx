import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { AudioTrack } from '../types';
import { Plus, Music2, GripVertical, Search, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { formatTime } from '../utils/format';
import { clsx } from 'clsx';

interface TrackListProps {
    tracks: AudioTrack[];
    onAddToPlaylist: (track: AudioTrack) => void;
    onDeleteTracks: (ids: string[]) => void;
    onOpenRecycleBin: () => void;
    deletedCount: number;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onSelectAll: (ids: string[]) => void;
}

const DraggableTrack: React.FC<{
    track: AudioTrack;
    onAddToPlaylist: (track: AudioTrack) => void;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}> = ({ track, onAddToPlaylist, isSelected, onToggleSelect }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: track.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "group flex items-center justify-between p-3 rounded-lg transition-colors border border-transparent animate-in fade-in slide-in-from-left-4 duration-300",
                isSelected ? "bg-blue-500/10 border-blue-500/20" : "hover:bg-neutral-800 hover:border-neutral-700"
            )}
            {...attributes}
            {...listeners}
            onPointerDown={(e) => {
                listeners?.onPointerDown?.(e);
            }}
        >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(track.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={clsx(
                            "text-neutral-500 hover:text-white transition-colors",
                            isSelected && "text-blue-400 hover:text-blue-300"
                        )}
                    >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <div className="text-neutral-500 p-1">
                        <GripVertical size={16} />
                    </div>
                </div>

                <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-neutral-500 group-hover:text-neutral-300">
                    <Music2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">
                        {track.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                        {(track.file.size / (1024 * 1024)).toFixed(2)} MB
                        {track.duration && track.duration > 0 && (
                            <span className="ml-2">
                                • {formatTime(track.duration)}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist(track);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 rounded-full hover:bg-blue-500/20 text-neutral-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Add to playlist"
            >
                <Plus size={18} />
            </button>
        </div>
    );
};

export const TrackList: React.FC<TrackListProps> = ({
    tracks,
    onAddToPlaylist,
    onDeleteTracks,
    onOpenRecycleBin,
    deletedCount,
    selectedIds,
    onToggleSelect,
    onSelectAll
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTracks = tracks.filter(track =>
        track.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectAll = () => {
        onSelectAll(filteredTracks.map(t => t.id));
    };

    const handleDeleteSelected = () => {
        onDeleteTracks(Array.from(selectedIds));
    };

    return (
        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Music2 size={20} className="text-blue-400" />
                        Available Tracks
                        <span className="text-xs font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                            {tracks.length}
                        </span>
                    </h2>

                    <button
                        onClick={onOpenRecycleBin}
                        className="text-xs flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-neutral-800"
                        title="Open Recycle Bin"
                    >
                        <Trash2 size={14} />
                        Bin ({deletedCount})
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search tracks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-800 text-sm text-white pl-9 pr-4 py-2 rounded-lg border border-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-neutral-500 transition-all"
                        />
                    </div>

                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors flex items-center gap-2"
                            title="Delete Selected"
                        >
                            <Trash2 size={16} />
                            <span className="text-sm font-medium">{selectedIds.size}</span>
                        </button>
                    )}
                </div>

                {tracks.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                        <button
                            onClick={handleSelectAll}
                            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5"
                        >
                            {selectedIds.size === filteredTracks.length && filteredTracks.length > 0 ? (
                                <CheckSquare size={14} />
                            ) : (
                                <Square size={14} />
                            )}
                            Select All
                        </button>

                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => onSelectAll([])}
                                className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5 ml-2"
                            >
                                <X size={14} />
                                Unselect All
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {tracks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
                        <p>No tracks uploaded yet.</p>
                        <p className="text-sm mt-2">Upload files to get started.</p>
                    </div>
                ) : filteredTracks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
                        <p>No tracks found.</p>
                        <p className="text-sm mt-2">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredTracks.map((track) => (
                            <DraggableTrack
                                key={track.id}
                                track={track}
                                onAddToPlaylist={onAddToPlaylist}
                                isSelected={selectedIds.has(track.id)}
                                onToggleSelect={onToggleSelect}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
