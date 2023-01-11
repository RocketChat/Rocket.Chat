import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { DragEvent, ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

type DropTargetOverlayProps = {
	enabled: boolean;
	reason?: ReactNode;
	onFileDrop?: (files: File[]) => void;
	visible?: boolean;
	onDismiss?: () => void;
};

function DropTargetOverlay({ enabled, reason, onFileDrop, visible = true, onDismiss }: DropTargetOverlayProps): ReactElement | null {
	const t = useTranslation();

	const handleDragLeave = useMutableCallback((event: DragEvent) => {
		event.stopPropagation();
		onDismiss?.();
	});

	const handleDragOver = useMutableCallback((event: DragEvent) => {
		event.stopPropagation();

		event.preventDefault();
		event.dataTransfer.dropEffect = ['move', 'linkMove'].includes(event.dataTransfer.effectAllowed) ? 'move' : 'copy';
	});

	const formatDateAndTime = useFormatDateAndTime();

	const handleDrop = useMutableCallback(async (event: DragEvent) => {
		event.stopPropagation();
		onDismiss?.();

		event.preventDefault();

		const files = Array.from(event.dataTransfer.files);

		if (event.dataTransfer.types.includes('text/uri-list') && event.dataTransfer.types.includes('text/html')) {
			const fragment = document.createRange().createContextualFragment(event.dataTransfer.getData('text/html'));
			for await (const { src } of Array.from(fragment.querySelectorAll('img'))) {
				try {
					const response = await fetch(src);
					const data = await response.blob();
					const extension = (await import('../../../../../app/utils/lib/mimeTypes')).mime.extension(data.type);
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
			backgroundColor='rgba(255, 255, 255, 0.8)'
			borderWidth={4}
			borderStyle='dashed'
			borderColor='currentColor'
			color={enabled ? 'primary' : 'danger'}
			className={css`
				animation-name: zoomIn;
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
