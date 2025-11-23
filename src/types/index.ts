export interface AudioTrack {
    id: string;
    file: File;
    name: string;
    duration?: number;
    path?: string; // For display purposes or if we can get the path
    deletedAt?: number; // Timestamp when the track was moved to recycle bin
}

export interface PlaylistItem extends AudioTrack {
    playlistId: string; // Unique ID for the playlist entry
}
