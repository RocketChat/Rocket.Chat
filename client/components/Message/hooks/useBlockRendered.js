import { useRef, useEffect } from 'react';

export const useBlockRendered = () => {
	const ref = useRef();
	useEffect(() => {
		ref.current.dispatchEvent(new Event('rendered'));
	}, []);
	return { className: 'js-block-wrapper', ref };
};
