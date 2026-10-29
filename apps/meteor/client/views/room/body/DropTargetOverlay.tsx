import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import type { DragEvent, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export type DropTargetOverlayProps = {
	enabled: boolean;
	reason?: ReactNode;
	onFileDrop?: (files: File[]) => void;
	onUrlDrop?: (url: string) => void;
	visible?: boolean;
	onDismiss?: () => void;
};

function DropTargetOverlay({ enabled, reason, onFileDrop, onUrlDrop, visible = true, onDismiss }: DropTargetOverlayProps) {
	const { t } = useTranslation();

	const handleDragLeave = useStableCallback((event: DragEvent) => {
		event.stopPropagation();
		onDismiss?.();
	});

	const handleDragOver = useStableCallback((event: DragEvent) => {
		event.stopPropagation();

		event.preventDefault();
		event.dataTransfer.dropEffect = ['move', 'linkMove'].includes(event.dataTransfer.effectAllowed) ? 'move' : 'copy';
	});

	const formatDateAndTime = useFormatDateAndTime();

	const handleDrop = useStableCallback(async (event: DragEvent) => {
		event.stopPropagation();
		onDismiss?.();

		event.preventDefault();

		const files = Array.from(event.dataTransfer.files);

		if (files.length === 0 && event.dataTransfer.types.includes('text/uri-list') && event.dataTransfer.types.includes('text/html')) {
			const html = event.dataTransfer.getData('text/html');
			const fragment = document.createRange().createContextualFragment(html);
			const hasImages = fragment.querySelector('img[src]') !== null;
			const link = fragment.querySelector('a[href]');
			const url =
				event.dataTransfer
					.getData('text/uri-list')
					.split(/\r?\n/)
					.find((line) => line && !line.startsWith('#')) || link?.getAttribute('href');

			if (!hasImages && url && link) {
				onUrlDrop?.(url);
				return;
			}

			for await (const { src } of Array.from(fragment.querySelectorAll('img'))) {
				try {
					const response = await fetch(src);
					const data = await response.blob();
					const extension = (await import('../../../../lib/mimeTypes')).mime.extension(data.type);
					const filename = `File - ${formatDateAndTime(new Date())}.${extension}`;
					const file = new File([data], filename, { type: data.type });
					files.push(file);
				} catch (error) {
					console.warn(error);
				}
			}
		}

		onFileDrop?.(files);
	});

	if (!visible) {
		return null;
	}

	return (
		<Box
			role='dialog'
			data-qa='DropTargetOverlay'
			position='absolute'
			zIndex={1_000_000}
			inset={0}
			display='flex'
			alignItems='center'
			justifyContent='center'
			fontScale='hero'
			textAlign='center'
			backgroundColor='surface-overlay'
			borderWidth='large'
			borderStyle='dashed'
			borderColor='currentColor'
			color={enabled ? 'default' : 'danger'}
			className={css`
				animation-name: zoom-in;
				animation-duration: 0.1s;
			`}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			{enabled ? t('Drop_to_upload_file') : reason}
		</Box>
	);
}

export default memo(DropTargetOverlay);
