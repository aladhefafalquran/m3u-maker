import React, { useState } from 'react';
import { X, Trash2, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import type { SavedPlaylist } from './PlaylistLibrary';
import { formatTime } from '../utils/format';

interface PlaylistRecycleBinProps {
    deletedPlaylists: SavedPlaylist[];
    onRestore: (ids: string[]) => void;
    onPermanentDelete: (ids: string[]) => void;
    onClose: () => void;
}

export const PlaylistRecycleBin: React.FC<PlaylistRecycleBinProps> = ({
    deletedPlaylists,
    onRestore,
    onPermanentDelete,
    onClose,
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === deletedPlaylists.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(deletedPlaylists.map(p => p.id)));
        }
    };

    const handleRestoreSelected = () => {
        onRestore(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    const handlePermanentDeleteSelected = () => {
        if (confirm(`Are you sure you want to permanently delete ${selectedIds.size} playlists? This cannot be undone.`)) {
            onPermanentDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/95 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Trash2 className="text-red-500" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-white">Playlist Recycle Bin</h2>
                            <p className="text-sm text-neutral-400">
                                {deletedPlaylists.length} deleted playlists
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center gap-3">
                    <button
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        {selectedIds.size === deletedPlaylists.length && deletedPlaylists.length > 0 ? 'Unselect All' : 'Select All'}
                    </button>

                    {selectedIds.size > 0 && (
                        <>
                            <div className="h-6 w-px bg-neutral-700 mx-1" />
                            <button
                                onClick={handleRestoreSelected}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                                <RotateCcw size={16} />
                                Restore ({selectedIds.size})
                            </button>
                            <button
                                onClick={handlePermanentDeleteSelected}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Forever ({selectedIds.size})
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {deletedPlaylists.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
                            <Trash2 size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Recycle bin is empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {deletedPlaylists.map((playlist) => (
                                <div
                                    key={playlist.id}
                                    onClick={() => handleToggleSelect(playlist.id)}
                                    className={`
                    flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedIds.has(playlist.id)
                                            ? 'bg-blue-500/10 border-blue-500/50'
                                            : 'bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800 hover:border-neutral-600'
                                        }
                  `}
                                >
                                    <div className={`
                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                    ${selectedIds.has(playlist.id)
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-neutral-500 bg-transparent'
                                        }
                  `}>
                                        {selectedIds.has(playlist.id) && <Check size={12} className="text-white" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{playlist.name}</h3>
                                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                                            <span>{(playlist.items || []).length} tracks</span>
                                            <span>•</span>
                                            <span>{formatTime((playlist.items || []).reduce((acc, item) => acc + (item.duration || 0), 0))}</span>
                                        </div>
                                    </div>

                                    {/* Warning for permanent delete */}
                                    <div className="text-xs text-red-400 flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded">
                                        <AlertTriangle size={12} />
                                        Deleted
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
