import { Emitter } from '@rocket.chat/emitter';
import { useEffect, useState } from 'react';

const ee = new Emitter();

const getDir = () => document.documentElement.getAttribute('dir') || 'ltr';

const config = { attributes: true, childList: false, subtree: false };
const callback = function (mutationsList) {
	for (const mutation of mutationsList) {
		if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
			ee.emit('change', getDir());
		}
	}
};

const observer = new MutationObserver(callback);
observer.observe(document.documentElement, config);

export const useDir = () => {
	const [dir, setDir] = useState(getDir);
	useEffect(() => {
		ee.on('change', setDir);
		return () => ee.off('change', setDir);
	}, []);
	return dir;
};
