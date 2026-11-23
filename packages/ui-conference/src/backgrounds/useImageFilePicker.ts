import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, InputHTMLAttributes, RefCallback } from 'react';
import { useCallback, useRef } from 'react';

type UseImageFilePickerOptions = {
	onPick: (file: File) => void;
	/** The browser's file picker closed, with or without a file. */
	onClose: () => void;
};

/** A hidden file input for one picture: spread `inputProps` on an `input`, and `open` shows the browser's file picker. */
export const useImageFilePicker = ({ onPick, onClose }: UseImageFilePickerOptions) => {
	const input = useRef<HTMLInputElement>(undefined);
	const close = useStableCallback(onClose);

	const ref: RefCallback<HTMLInputElement> = useCallback(
		(node: HTMLInputElement) => {
			input.current = node;
			// A dismissed file picker fires `cancel`, not `change`, and React has no `onCancel` for inputs.
			node.addEventListener('cancel', close);

			return () => {
				node.removeEventListener('cancel', close);
				input.current = undefined;
			};
		},
		[close],
	);

	const inputProps: InputHTMLAttributes<HTMLInputElement> & { ref: RefCallback<HTMLInputElement> } = {
		ref,
		type: 'file',
		accept: 'image/*',
		hidden: true,
		onChange: (event: ChangeEvent<HTMLInputElement>) => {
			const [file] = event.currentTarget.files ?? [];
			event.currentTarget.value = '';
			close();
			if (file) {
				onPick(file);
			}
		},
	};

	return { open: () => input.current?.click(), inputProps };
};
