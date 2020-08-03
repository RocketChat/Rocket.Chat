import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRef, useEffect } from 'react';

export const useFileInput = (onSetFile, fileType = 'image') => {
	const ref = useRef();

	useEffect(() => {
		const fileInput = document.createElement('input');
		const formData = new FormData();
		fileInput.setAttribute('type', 'file');
		fileInput.setAttribute('style', 'display: none');
		document.body.appendChild(fileInput);

		ref.current = fileInput;
		const handleFiles = () => {
			formData.append(fileType, fileInput.files[0]);
			onSetFile(fileInput.files[0], formData);
		};
		fileInput.addEventListener('change', handleFiles, false);

		return () => {
			fileInput.parentNode.removeChild(fileInput);
		};
	}, [fileType, onSetFile]);

	const onClick = useMutableCallback(() => ref.current.click());
	const reset = useMutableCallback(() => {
		ref.current.value = '';
	});
	return [onClick, reset];
};
