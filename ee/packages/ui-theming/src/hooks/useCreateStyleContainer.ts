import { useMemo } from 'react';

export const useCreateStyleContainer = (id: string) => {
	return useMemo(() => {
		const refElement = document.getElementById('rcx-styles') || document.head.lastChild;

		const el = document.getElementById(id);

		if (el) {
			return el;
		}

		const styleElement = document.createElement('style');
		styleElement.setAttribute('id', id);

		document.head.insertBefore(styleElement, refElement);
		document.head.appendChild(document.createElement('style'));
		return styleElement;
	}, [id]);
};
