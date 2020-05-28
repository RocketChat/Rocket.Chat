import { useState, useEffect } from 'react';

export const useFileInput = (onSetFile, fileType = 'image') => {
	const [openInput, setOpenInput] = useState();

	useEffect(() => {
		const fileInput = document.createElement('input');
		const formData = new FormData();
		fileInput.setAttribute('type', 'file');
		fileInput.setAttribute('style', 'display: none');
		document.body.appendChild(fileInput);

		const handleFiles = function() {
			formData.append(fileType, this.files[0]);
			onSetFile(this.files[0], formData);
		};
		fileInput.addEventListener('change', handleFiles, false);
		setOpenInput(() => () => fileInput.click());
		return () => {
			fileInput.parentNode.removeChild(fileInput);
		};
	}, [onSetFile]);

	return openInput;
};
