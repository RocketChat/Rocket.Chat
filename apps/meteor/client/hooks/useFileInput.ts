import { useRef, useEffect } from 'react';
import type { AllHTMLAttributes } from 'react';

import { useChat } from '../views/room/contexts/ChatContext';

export const useFileInput = (props: AllHTMLAttributes<HTMLInputElement>) => {
	const fileInputRef = useRef<HTMLInputElement>(undefined);
	const chatContext = useChat();

	useEffect(() => {
		const { current: composerNode } = chatContext?.composer?.composerRef || {};
		if (!composerNode) {
			return;
		}

		const fileInput = document.createElement('input');
		fileInput.setAttribute('style', 'display: none;');
		Object.entries(props).forEach(([key, value]) => {
			fileInput.setAttribute(key, value);
		});

		composerNode.appendChild(fileInput);
		fileInputRef.current = fileInput;

		return (): void => {
			fileInputRef.current = undefined;
			fileInput.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props]);

	return fileInputRef;
};
