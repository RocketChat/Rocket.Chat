import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useRef, useCallback, useEffect } from 'react';
import type { AllHTMLAttributes } from 'react';

import { useChat } from '../views/room/contexts/ChatContext';

export const useFileInput = (props: AllHTMLAttributes<HTMLInputElement>) => {
	const fileInputRef = useRef<HTMLInputElement>();
	const chatContext = useChat();

	const setupFileInput = useSafeRefCallback(
		useCallback(
			(composerNode: HTMLElement) => {
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
			},
			[props],
		),
	);

	useEffect(() => {
		const { current: composerNode } = chatContext?.composer?.composerRef || {};
		if (composerNode) {
			setupFileInput(composerNode);
		}

		return () => {
			setupFileInput(null);
		};
	}, [setupFileInput]);

	return fileInputRef;
};
