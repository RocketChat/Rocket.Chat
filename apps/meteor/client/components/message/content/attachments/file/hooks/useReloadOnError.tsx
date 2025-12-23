import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef, useState } from 'react';

const events = ['error', 'stalled', 'play'];

function toURL(urlString: string): URL {
	try {
		return new URL(urlString);
	} catch {
		return new URL(urlString, window.location.href);
	}
}

const getRedirectURLInfo = async (url: string): Promise<{ redirectUrl: string | false; expires: number | null }> => {
	const _url = toURL(url);
	_url.searchParams.set('replyWithRedirectUrl', 'true');
	const response = await fetch(_url, {
		credentials: 'same-origin',
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch URL info: ${response.statusText}`);
	}

	const data = await response.json();

	return {
		redirectUrl: data.redirectUrl,
		expires: data.expires ? new Date(data.expires).getTime() : null,
	};
};

const renderBufferingUIFallback = (vidEl: HTMLVideoElement) => {
	const computed = getComputedStyle(vidEl);

	const videoTempStyles = {
		width: vidEl.style.width,
		height: vidEl.style.height,
	};
	Object.assign(vidEl.style, {
		width: computed.width,
		height: computed.height,
	});

	return () => {
		Object.assign(vidEl.style, videoTempStyles);
	};
};

export const useReloadOnError = (url: string, type: 'video' | 'audio') => {
	const [expiresAt, setExpiresAt] = useState<number | null>(null);
	const isRecovering = useRef(false);
	const firstRecoveryAttempted = useRef(false);

	const handleMediaURLRecovery = useEffectEvent(async (event: Event) => {
		if (isRecovering.current) {
			console.debug(`Media URL recovery already in progress, skipping ${event.type} event`);
			return;
		}
		isRecovering.current = true;

		const node = event.target as HTMLMediaElement | null;
		if (!node) {
			isRecovering.current = false;
			return;
		}

		if (firstRecoveryAttempted.current) {
			if (!expiresAt) {
				console.debug('No expiration time set, skipping recovery');
				isRecovering.current = false;
				return;
			}
		} else if (event.type === 'play') {
			// The user has initiated a playback for the first time, probably we should wait for the stalled or error event
			// the url may still be valid since we dont know the expiration time yet
			isRecovering.current = false;
			return;
		}

		firstRecoveryAttempted.current = true;

		if (expiresAt && Date.now() < expiresAt) {
			console.debug('Media URL is still valid, skipping recovery');
			isRecovering.current = false;
			return;
		}

		console.debug('Handling media URL recovery for event:', event.type);

		let cleanup: (() => void) | undefined;
		if (type === 'video') {
			cleanup = renderBufferingUIFallback(node as HTMLVideoElement);
		}

		const wasPlaying = !node.paused;
		const { currentTime } = node;

		try {
			const { redirectUrl: newUrl, expires: newExpiresAt } = await getRedirectURLInfo(url);
			setExpiresAt(newExpiresAt);
			node.src = newUrl || url;

			const onCanPlay = async () => {
				node.removeEventListener('canplay', onCanPlay);

				node.currentTime = currentTime;
				if (wasPlaying) {
					try {
						await node.play();
					} catch (playError) {
						console.warn('Failed to resume playback after URL recovery:', playError);
					} finally {
						isRecovering.current = false;
					}
				}
			};

			const onMetaDataLoaded = () => {
				node.removeEventListener('loadedmetadata', onMetaDataLoaded);
				isRecovering.current = false;
				cleanup?.();
			};

			node.addEventListener('canplay', onCanPlay, { once: true });
			node.addEventListener('loadedmetadata', onMetaDataLoaded, { once: true });
			node.load();
		} catch (err) {
			console.error('Error during URL recovery:', err);
			isRecovering.current = false;
			cleanup?.();
		}
	});

	const mediaRefCallback = useSafeRefCallback(
		useCallback(
			(node: HTMLAudioElement | null) => {
				if (!node) {
					return;
				}

				events.forEach((event) => {
					node.addEventListener(event, handleMediaURLRecovery);
				});
				return () => {
					events.forEach((event) => {
						node.removeEventListener(event, handleMediaURLRecovery);
					});
				};
			},
			[handleMediaURLRecovery],
		),
	);

	return { mediaRef: mediaRefCallback };
};
