import type { PlaylistItem } from '../types';

export const generateM3U = (playlist: PlaylistItem[], basePath: string = ''): string => {
    let content = '#EXTM3U\n';

    playlist.forEach((track) => {
        // #EXTINF:duration,title
        // filename
        const duration = track.duration || -1;
        content += `#EXTINF:${duration},${track.name}\n`;

        // Use basePath if provided, otherwise just filename
        // Ensure basePath ends with a separator if it's not empty and doesn't have one
        let path = track.file.name;
        if (basePath) {
            const separator = basePath.includes('/') ? '/' : '\\';
            const cleanBasePath = basePath.endsWith('/') || basePath.endsWith('\\')
                ? basePath
                : `${basePath}${separator}`;
            path = `${cleanBasePath}${track.file.name}`;
        }

        content += `${path}\n`;
    });

    return content;
};

export const downloadM3U = (content: string, filename: string = 'track.m3u'): void => {
    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
