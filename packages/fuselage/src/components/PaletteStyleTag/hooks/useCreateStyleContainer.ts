import { useMemo } from 'react';

import { useOwnerDocument } from '../../../contexts';

export const useCreateStyleContainer = (id: string) => {
	const { document: ownerDocument } = useOwnerDocument();
	return useMemo(() => {
		const refElement = ownerDocument.getElementById('rcx-styles') || ownerDocument.head.lastChild;

		const el = ownerDocument.getElementById(id);

		if (el) {
			return el;
		}

		const styleElement = ownerDocument.createElement('style');
		styleElement.setAttribute('id', id);

		ownerDocument.head.insertBefore(styleElement, refElement);
		ownerDocument.head.appendChild(ownerDocument.createElement('style'));
		return styleElement;
	}, [id, ownerDocument]);
};
