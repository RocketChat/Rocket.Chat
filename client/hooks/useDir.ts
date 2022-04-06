import { Emitter } from '@rocket.chat/emitter';
import { useEffect, useState } from 'react';

const ee = new Emitter();

const getDir = (): string => document.documentElement.getAttribute('dir') || 'ltr';

const config = { attributes: true, childList: false, subtree: false };
const callback = function (mutationsList: any): void {
	for (const mutation of mutationsList) {
		if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
			ee.emit('change', getDir());
		}
	}
};

const observer = new MutationObserver(callback);
observer.observe(document.documentElement, config);

export const useDir = (): string => {
	const [dir, setDir] = useState(getDir);
	useEffect(() => {
		ee.on('change', setDir);
		return (): void => ee.off('change', setDir);
	}, []);
	return dir;
};
