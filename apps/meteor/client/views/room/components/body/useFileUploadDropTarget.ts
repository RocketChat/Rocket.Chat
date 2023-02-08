import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import type React from 'react';
import { useCallback, useMemo } from 'react';

import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { useChat } from '../../contexts/ChatContext';
import { useRoom } from '../../contexts/RoomContext';
import { useDropTarget } from './useDropTarget';

export const useFileUploadDropTarget = (): readonly [
	fileUploadTriggerProps: {
		onDragEnter: (event: React.DragEvent<Element>) => void;
	},
	fileUploadOverlayProps: {
		visible: boolean;
		onDismiss: () => void;
		enabled: boolean;
		reason?: ReactNode;
	},
] => {
	const room = useRoom();
	const { triggerProps, overlayProps } = useDropTarget();

	const t = useTranslation();

	const fileUploadEnabled = useSetting('FileUpload_Enabled') as boolean;
	const user = useUser();
	const fileUploadAllowedForUser = useReactiveValue(
		useCallback(() => !roomCoordinator.readOnly(room._id, { username: user?.username }), [room._id, user?.username]),
	);

	const chat = useChat();

	const onFileDrop = useMutableCallback(async (files: File[]) => {
		const { mime } = await import('../../../../../app/utils/lib/mimeTypes');

		const uploads = Array.from(files).map((file) => {
			Object.defineProperty(file, 'type', { value: mime.lookup(file.name) });
			return file;
		});

		chat?.flows.uploadFiles(uploads);
	});

	const allOverlayProps = useMemo(() => {
		if (!fileUploadEnabled) {
			return {
				enabled: false,
				reason: t('FileUpload_Disabled'),
				...overlayProps,
			} as const;
		}

		if (!fileUploadAllowedForUser) {
			return {
				enabled: false,
				reason: t('error-not-allowed'),
				...overlayProps,
			} as const;
		}

		return {
			enabled: true,
			onFileDrop,
			...overlayProps,
		} as const;
	}, [fileUploadAllowedForUser, fileUploadEnabled, onFileDrop, overlayProps, t]);

	return [triggerProps, allOverlayProps] as const;
};
