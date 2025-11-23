export const parseM3U = (content: string): string[] => {
    const lines = content.split(/\r?\n/);
    const filenames: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Skip comments and directives
        if (trimmed.startsWith('#')) continue;

        // This is a file path/name line
        // We only care about the filename for matching, so we extract the basename
        // Handle both forward and backward slashes
        const basename = trimmed.split(/[/\\]/).pop();
        if (basename) {
            filenames.push(basename);
        }
    }

    return filenames;
};
