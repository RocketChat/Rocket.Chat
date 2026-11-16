import type { DragEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

const hasFilesToUpload = (dataTransfer: DataTransfer): boolean => dataTransfer.types.includes('Files');

const hasURLToUpload = (dataTransfer: DataTransfer): boolean =>
	dataTransfer.types.includes('text/uri-list') && dataTransfer.types.includes('text/html');

export const useDropTarget = (): {
	triggerProps: {
		onDragEnter: (event: DragEvent<Element>) => void;
		onDragLeave: (event: DragEvent<Element>) => void;
	};
	overlayProps: {
		visible: boolean;
		onDismiss: () => void;
	};
} => {
	const [visible, setVisible] = useState(false);

	const onDragEnter = useCallback((event: DragEvent) => {
		event.stopPropagation();

		if (!hasFilesToUpload(event.dataTransfer) && !hasURLToUpload(event.dataTransfer)) {
			return;
		}

		setVisible(true);
	}, []);

	const onDragLeave = useCallback((event: DragEvent) => {
		event.stopPropagation();

		const { relatedTarget } = event;
		if (!(relatedTarget instanceof Node) || event.currentTarget.contains(relatedTarget)) {
			return;
		}

		setVisible(false);
	}, []);

	const onDismiss = useCallback(() => {
		setVisible(false);
	}, []);

	const triggerProps = useMemo(() => ({ onDragEnter, onDragLeave }), [onDragEnter, onDragLeave]);
	const overlayProps = useMemo(() => ({ visible, onDismiss }), [visible, onDismiss]);

	return {
		triggerProps,
		overlayProps,
	};
};
