import type { RefObject } from 'react';
import { useRef, useEffect } from 'react';

// @deprecated
export const useBlockRendered = <T extends HTMLElement>(): {
	className: string;
	ref: RefObject<T>;
} => {
	const ref = useRef<T>(null);
	useEffect(() => {
		ref.current?.dispatchEvent(new Event('rendered'));
	}, []);
	return { className: 'js-block-wrapper', ref };
};
