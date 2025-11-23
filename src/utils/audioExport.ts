import type { AudioTrack } from '../types';

export const downloadAllAudioFiles = async (tracks: AudioTrack[]): Promise<void> => {
    for (const track of tracks) {
        const url = URL.createObjectURL(track.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = track.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
    }
};
