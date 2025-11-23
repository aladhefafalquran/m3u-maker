import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PlaylistItem } from '../types';
import { GripVertical, X, Music } from 'lucide-react';
import { clsx } from 'clsx';
import { formatTime } from '../utils/format';

interface SortableTrackProps {
    item: PlaylistItem;
    onRemove: (id: string) => void;
}

export const SortableTrack: React.FC<SortableTrackProps> = ({ item, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `playlist-item-${item.playlistId}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 group hover:border-neutral-600 transition-all",
                isDragging && "opacity-50 scale-105 z-50 shadow-xl ring-2 ring-blue-500/50"
            )}
            {...attributes}
            {...listeners}
        >
            <div className="text-neutral-500 hover:text-neutral-300 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-neutral-700/50">
                <GripVertical size={18} />
            </div>

            <div className="w-8 h-8 rounded bg-neutral-700/50 flex items-center justify-center text-neutral-500">
                <Music size={16} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">
                    {item.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    {item.duration && item.duration > 0 && (
                        <span className="ml-2">
                            • {formatTime(item.duration)}
                        </span>
                    )}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.playlistId);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from playlist"
            >
                <X size={18} />
            </button>
        </div>
    );
};
