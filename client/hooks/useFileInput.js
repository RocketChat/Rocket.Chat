import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useState, useEffect } from 'react';

export const useFileInput = (onSetFile, fileType = 'image') => {
	const [openInput, setOpenInput] = useState(() => () => {});
	const handleSetFile = useMutableCallback(onSetFile);

	useEffect(() => {
		const fileInput = document.createElement('input');
		const formData = new FormData();
		fileInput.setAttribute('type', 'file');
		fileInput.setAttribute('style', 'display: none');
		document.body.appendChild(fileInput);

		const handleFiles = () => {
			formData.append(fileType, fileInput.files[0]);
			handleSetFile(fileInput.files[0], formData);
		};
		fileInput.addEventListener('change', handleFiles, false);
		setOpenInput(() => () => fileInput.click());
		return () => {
			fileInput.parentNode.removeChild(fileInput);
		};
	}, [fileType, handleSetFile]);

	return openInput;
};
