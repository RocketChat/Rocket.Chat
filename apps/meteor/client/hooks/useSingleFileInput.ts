import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRef, useEffect } from 'react';

export const useSingleFileInput = (
	onSetFile: (file: File, formData: FormData) => void,
	fileType = 'image/*',
	fileField = 'image',
	maxSize?: number, // In bytes
	onError?: () => void,
): [onClick: () => void, reset: () => void] => {
	const ref = useRef<HTMLInputElement>();

	useEffect(() => {
		const fileInput = document.createElement('input');
		fileInput.setAttribute('type', 'file');
		fileInput.setAttribute('style', 'display: none');
		document.body.appendChild(fileInput);
		ref.current = fileInput;

		return (): void => {
			ref.current = undefined;
			fileInput.remove();
		};
	}, []);

	useEffect(() => {
		const fileInput = ref.current;
		if (!fileInput) {
			return;
		}

		fileInput.setAttribute('accept', fileType);
	}, [fileType]);

	useEffect(() => {
		const fileInput = ref.current;
		if (!fileInput) {
			return;
		}

		const handleFiles = (): void => {
			if (!fileInput?.files?.length) {
				return;
			}

			const file = fileInput.files[0];

			if (maxSize !== undefined && file.size > maxSize) {
				onError?.();
				fileInput.value = '';
				return;
			}

			const formData = new FormData();
			formData.append(fileField, file);
			onSetFile(file, formData);
		};

		fileInput.addEventListener('change', handleFiles, false);

		return (): void => {
			fileInput.removeEventListener('change', handleFiles, false);
		};
	}, [fileField, fileType, onSetFile, maxSize, onError]);

	const onClick = useEffectEvent(() => ref?.current?.click());
	const reset = useEffectEvent(() => {
		if (ref.current) {
			ref.current.value = '';
		}
	});
	return [onClick, reset];
};
