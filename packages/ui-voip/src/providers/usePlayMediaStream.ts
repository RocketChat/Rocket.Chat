import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

export const usePlayMediaStream = (
	stream?: MediaStream | null,
): [(node: HTMLAudioElement | null) => void, { current: HTMLAudioElement | null }] => {
	const actualRef = useRef<HTMLAudioElement | null>(null);

	return [
		useSafeRefCallback(
			useCallback(
				(node: HTMLAudioElement) => {
					actualRef.current = node;

					if (!stream) {
						return;
					}

					node.srcObject = stream;
					node.play().catch((error) => {
						console.warn('MediaCall: usePlayMediaStream - Stream stopped playing', error);
					});

					return () => {
						actualRef.current = null;
						node.pause();
						node.srcObject = null;
					};
				},
				[stream],
			),
		),
		actualRef,
	];
};
