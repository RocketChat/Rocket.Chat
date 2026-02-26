import type { FileAttachmentProps } from '@rocket.chat/core-typings';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useRef } from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';

import GenericFileAttachment from './GenericFileAttachment';

interface PdfPreviewState {
    preview: string | null;
    pageCount: number;
    loading: boolean;
    error: boolean;
}

const PdfAttachment = (attachment: FileAttachmentProps) => {
    const [state, setState] = useState<PdfPreviewState>({
        preview: null,
        pageCount: 0,
        loading: true,
        error: false,
    });

    const getURL = useMediaUrl();
    const abortControllerRef = useRef<AbortController | null>(null);

    const url = getURL(attachment.title_link || attachment.image_url || '');

    useEffect(() => {
        if (!url) {
            setState(prev => ({ ...prev, loading: false, error: true }));
            return;
        }

        abortControllerRef.current = new AbortController();

        const renderPdfPreview = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: false }));

                // Dynamically import pdfjs
                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');

                // Set worker to legacy build path
                pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/legacy/build/pdf.worker.entry');

                const loadingTask = pdfjsLib.getDocument({
                    url,
                    withCredentials: true,
                    verbosity: 0,
                });

                const pdfDoc = await loadingTask.promise;

                if (abortControllerRef.current?.signal.aborted) {
                    await pdfDoc.destroy();
                    return;
                }

                const pageCount = pdfDoc.numPages;
                const page = await pdfDoc.getPage(1);

                if (abortControllerRef.current?.signal.aborted) {
                    page.cleanup();
                    await pdfDoc.destroy();
                    return;
                }

                // Scale for thumbnail
                const scale = 0.5;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', {
                    alpha: false,
                    willReadFrequently: false,
                });

                if (!context) {
                    throw new Error('Could not get canvas 2D context');
                }

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                if (abortControllerRef.current?.signal.aborted) {
                    page.cleanup();
                    await pdfDoc.destroy();
                    return;
                }

                const dataUrl = canvas.toDataURL('image/png', 0.85);

                setState({
                    preview: dataUrl,
                    pageCount,
                    loading: false,
                    error: false,
                });

                page.cleanup();
                await pdfDoc.destroy();

            } catch (err) {
                console.error('PDF preview render error:', err);

                if (!abortControllerRef.current?.signal.aborted) {
                    setState({
                        preview: null,
                        pageCount: 0,
                        loading: false,
                        error: true,
                    });
                }
            }
        };

        renderPdfPreview();

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [url]);

    // Fallback to generic file attachment if loading, error, or no preview
    if (state.loading || state.error || !state.preview) {
        return <GenericFileAttachment {...attachment} />;
    }

    // Format file size
    const formatFileSize = (bytes: number | undefined): string => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const fileSize = formatFileSize(attachment.size);

    return (
        <Box
            is='a'
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            download={attachment.title_link_download ? attachment.title : undefined}
            style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '340px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f0f2f5',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {/* Thumbnail Preview */}
            <Box
                style={{
                    width: '100%',
                    height: '180px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                <img
                    src={state.preview}
                    alt={attachment.title || 'PDF preview'}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                    }}
                />
            </Box>

            {/* Document Info Bar */}
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#e9edef',
                    gap: '12px',
                }}
            >
                {/* PDF Icon */}
                <Box
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#dc3545',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Icon name='file-pdf' size='x24' color='#ffffff' />
                </Box>

                {/* File Info */}
                <Box
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                    }}
                >
                    <Box
                        style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#111b21',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {attachment.title || 'document.pdf'}
                    </Box>
                    <Box
                        style={{
                            fontSize: '12px',
                            color: '#667781',
                        }}
                    >
                        {state.pageCount} {state.pageCount === 1 ? 'page' : 'pages'} • PDF {fileSize && `• ${fileSize}`}
                    </Box>
                </Box>

                {/* Download Icon */}
                <Box
                    style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Icon name='download' size='x20' color='#667781' />
                </Box>
            </Box>
        </Box>
    );
};

export default PdfAttachment;