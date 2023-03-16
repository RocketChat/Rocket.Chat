import { useMemo } from 'react';

export const useCreateStyleContainer = (id: string) => {
	return useMemo(() => {
		const refElement = document.getElementById('css-theme') || document.head.lastChild;
		const styleElement = document.createElement('style');
		styleElement.setAttribute('id', id);
		document.head.insertBefore(styleElement, refElement);
		return document.getElementById(id) || document.head.appendChild(document.createElement('style'));
	}, [id]);
};
