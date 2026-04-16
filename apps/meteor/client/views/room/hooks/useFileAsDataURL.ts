import { useEffect, useState } from 'react';

type ReaderOnloadCallback = (url: FileReader['result']) => void;

const readFileAsDataURL = (file: File, callback: ReaderOnloadCallback): void => {
	const reader = new FileReader();
	reader.onload = (e): void => callback(e?.target?.result || null);

	return reader.readAsDataURL(file);
};

export const useFileAsDataURL = (file: File): [loaded: boolean, url: null | FileReader['result']] => {
	const [loaded, setLoaded] = useState(false);
	const [url, setUrl] = useState<FileReader['result']>(null);

	useEffect(() => {
		setLoaded(false);
		readFileAsDataURL(file, (url) => {
			setUrl(url);
			setLoaded(true);
		});
	}, [file]);
	return [loaded, url];
};
