import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a']
        }
    });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4 group",
                isDragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/50"
            )}
        >
            <input {...getInputProps()} />
            <div className={clsx(
                "p-4 rounded-full transition-colors",
                isDragActive ? "bg-blue-500/20 text-blue-400" : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200"
            )}>
                {isDragActive ? <Music size={32} /> : <Upload size={32} />}
            </div>
            <div className="text-center">
                <p className="text-lg font-medium text-neutral-200">
                    {isDragActive ? "Drop audio files here" : "Drag & drop audio files"}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                    or click to select files
                </p>
            </div>
        </div>
    );
};
