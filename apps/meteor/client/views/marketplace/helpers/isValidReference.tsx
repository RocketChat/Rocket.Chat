import type { RefObject } from 'react';

export const isValidReference = (reference: RefObject<HTMLElement>, e: { target: Node | null }): boolean => {
	const isValidTarget = Boolean(e.target);
	const isValidReference = e.target !== reference.current && !reference.current?.contains(e.target);

	return isValidTarget && isValidReference;
};
