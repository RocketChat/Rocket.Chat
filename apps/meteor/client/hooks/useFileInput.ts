import { useRef, useEffect } from 'react';
import type { AllHTMLAttributes } from 'react';

export const useFileInput = (props: AllHTMLAttributes<HTMLInputElement>) => {
	const ref = useRef<HTMLInputElement>();

	useEffect(() => {
		const fileInput = document.createElement('input');
		fileInput.setAttribute('style', 'display: none;');
		Object.entries(props).forEach(([key, value]) => {
			fileInput.setAttribute(key, value);
		});
		document.body.appendChild(fileInput);
		ref.current = fileInput;

		return (): void => {
			ref.current = undefined;
			fileInput.remove();
		};
	}, [props]);

	return ref;
};
