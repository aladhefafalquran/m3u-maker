import React from 'react';
import { Trash2, RefreshCw, X, Clock } from 'lucide-react';
import type { AudioTrack } from '../types';
import { formatTime } from '../utils/format';

interface RecycleBinProps {
    deletedTracks: AudioTrack[];
    onRestore: (ids: string[]) => void;
    onPermanentDelete: (ids: string[]) => void;
    onClose: () => void;
}

export const RecycleBin: React.FC<RecycleBinProps> = ({
    deletedTracks,
    onRestore,
    onPermanentDelete,
    onClose,
}) => {
    const getDaysRemaining = (deletedAt: number) => {
        const days = 30 - Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Trash2 size={20} className="text-red-400" />
                        Recycle Bin
                        <span className="text-xs font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                            {deletedTracks.length} items
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {deletedTracks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-12">
                            <Trash2 size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Recycle bin is empty</p>
                            <p className="text-sm mt-1">Deleted tracks will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {deletedTracks.map((track) => (
                                <div
                                    key={track.id}
                                    className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
                                >
                                    <div className="flex-1 min-w-0 mr-4">
                                        <p className="text-sm font-medium text-neutral-200 truncate">
                                            {track.name}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-xs text-neutral-500">
                                                {(track.file.size / (1024 * 1024)).toFixed(2)} MB • {formatTime(track.duration || 0)}
                                            </p>
                                            <span className="flex items-center gap-1 text-xs text-orange-400/80 bg-orange-400/10 px-1.5 py-0.5 rounded">
                                                <Clock size={10} />
                                                {getDaysRemaining(track.deletedAt!)} days left
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onRestore([track.id])}
                                            className="p-2 text-neutral-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                            title="Restore"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button
                                            onClick={() => onPermanentDelete([track.id])}
                                            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {deletedTracks.length > 0 && (
                    <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
                        <button
                            onClick={() => onRestore(deletedTracks.map(t => t.id))}
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Restore All
                        </button>
                        <button
                            onClick={() => onPermanentDelete(deletedTracks.map(t => t.id))}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Empty Bin
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
