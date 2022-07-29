import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRef, useEffect } from 'react';

export const useFileInput = (
	onSetFile: (file: FileList[number], formData: FormData) => void,
	fileType = 'image/*',
	fileField = 'image',
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
			const formData = new FormData();
			formData.append(fileField, fileInput.files[0]);
			onSetFile(fileInput.files[0], formData);
		};

		fileInput.addEventListener('change', handleFiles, false);

		return (): void => {
			fileInput.removeEventListener('change', handleFiles, false);
		};
	}, [fileField, fileType, onSetFile]);

	const onClick = useMutableCallback(() => ref?.current?.click());
	const reset = useMutableCallback(() => {
		if (ref.current) {
			ref.current.value = '';
		}
	});
	return [onClick, reset];
};
