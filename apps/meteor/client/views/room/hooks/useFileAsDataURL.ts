import { useEffect, useState } from 'react';

export const useFileAsDataURL = (file: File): [loaded: boolean, url: null | FileReader['result']] => {
	const [loaded, setLoaded] = useState(false);
	const [url, setUrl] = useState<FileReader['result']>(null);

	useEffect(() => {
		setLoaded(false);
		setUrl(null);

		let shouldIgnore = false;
		const reader = new FileReader();

		reader.onload = (e): void => {
			if (shouldIgnore) {
				return;
			}

			setUrl(e?.target?.result || null);
			setLoaded(true);
		};

		reader.onerror = (): void => {
			if (shouldIgnore) {
				return;
			}

			setUrl(null);
			setLoaded(true);
		};

		reader.readAsDataURL(file);

		return () => {
			shouldIgnore = true;
			if (reader.readyState === FileReader.LOADING) {
				reader.abort();
			}
		};
	}, [file]);
	return [loaded, url];
};
