import { useOwnerDocument } from '@rocket.chat/fuselage';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

type FSResult = {
	fullscreen: boolean;
	enabled: boolean;
};

/**
 * @description
 * Creates subscribe/getSnapshot for use within useSyncExternalStore
 * Tracks if any elements in the passed document are in fullscreen state by listening to `fullscreenchange` event
 */
const makeFullscreenSubscription = (ownerDocument: Document) => {
	let result: FSResult = { fullscreen: Boolean(ownerDocument.fullscreenElement), enabled: ownerDocument.fullscreenEnabled };

	const getSnapshot = () => {
		const fullscreen = Boolean(ownerDocument.fullscreenElement);
		const enabled = ownerDocument.fullscreenEnabled;

		if (result.fullscreen !== fullscreen || result.enabled !== enabled) {
			result = { fullscreen, enabled };
		}
		return result;
	};

	const subscribe = (onStoreChange: () => void) => {
		const onChange = (e: any) => {
			onStoreChange();
			console.log(e);
		};

		ownerDocument.addEventListener('fullscreenchange', onChange);
		return () => {
			ownerDocument.removeEventListener('fullscreenchange', onChange);
		};
	};

	return { subscribe, getSnapshot };
};

type FullScreenToggleReturn = {
	/** wether any element in the current document (uses OwnerDocument from fuselage) is in fullscreen state */
	fullscreen: boolean;
	/** wether requestFullscreen is supported*/
	enabled: boolean;
	/** Calls documentElement.requestFullscreen, or document.exitFullscreen if {fullscreen} is false */
	toggleFullscreen: () => Promise<void>;
};

/**
 * @description Hook to transition and track full screen transitioning
 * 	- Uses {useOwnerDocument} from fuselage, take into consideration wrapped `OwnerDocument` contexts when using to ensure correct behaviour.
 *  - Caveat: Triggering fullscreen through `F11` or Platform specific window controls is not identifiable. Also, `exitFullscreen` cannot revert this action, so the states returned by this hook might not accurately depict the current window state.
 */
export const useFullscreenToggle = (): FullScreenToggleReturn => {
	const { document: ownerDocument } = useOwnerDocument();
	const { subscribe, getSnapshot } = useMemo(() => makeFullscreenSubscription(ownerDocument), [ownerDocument]);
	const { fullscreen, enabled } = useSyncExternalStore(subscribe, getSnapshot);

	const toggleFullscreen = useCallback(async () => {
		if (!enabled) {
			return;
		}

		if (fullscreen) {
			await ownerDocument.exitFullscreen();
		} else {
			await ownerDocument.documentElement.requestFullscreen();
		}
	}, [ownerDocument, fullscreen, enabled]);

	return {
		fullscreen,
		enabled,
		toggleFullscreen,
	};
};
