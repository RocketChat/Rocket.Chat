import { useOwnerDocument } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type FSResult = {
	/** wether any element in the current document (uses OwnerDocument from fuselage) is in fullscreen state */
	fullscreen: boolean;
	/** wether requestFullscreen is supported*/
	enabled: boolean;
};

type FullScreenToggleReturn = FSResult & {
	/** Calls documentElement.requestFullscreen, or document.exitFullscreen if {fullscreen} is false */
	toggleFullscreen: () => Promise<void>;
};

const getFullscreenState = (ownerDocument: Document): FSResult => {
	return { fullscreen: Boolean(ownerDocument.fullscreenElement), enabled: ownerDocument.fullscreenEnabled };
};

/**
 * @description Hook to transition and track full screen transitioning
 * 	- Uses {useOwnerDocument} from fuselage, take into consideration wrapped `OwnerDocument` contexts when using to ensure correct behaviour.
 *  - Caveat: Triggering fullscreen through `F11` or Platform specific window controls is not identifiable. Also, `exitFullscreen` cannot revert this action, so the states returned by this hook might not accurately depict the current window state.
 */
export const useFullscreenToggle = (): FullScreenToggleReturn => {
	const { t } = useTranslation();
	const { document: ownerDocument } = useOwnerDocument();
	const [{ fullscreen, enabled }, setState] = useState<FSResult>(() => getFullscreenState(ownerDocument));
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const onChange = () => {
			setState(getFullscreenState(ownerDocument));
		};

		ownerDocument.addEventListener('fullscreenchange', onChange);
		return () => {
			ownerDocument.removeEventListener('fullscreenchange', onChange);
		};
	}, [ownerDocument]);

	const toggleFullscreen = useCallback(async () => {
		const { fullscreen, enabled } = getFullscreenState(ownerDocument);
		if (!enabled) {
			return;
		}

		try {
			if (fullscreen) {
				await ownerDocument.exitFullscreen();
			} else {
				await ownerDocument.documentElement.requestFullscreen();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Fullscreen_failed_to_switch_not_allowed') });
		}
	}, [ownerDocument, dispatchToastMessage, t]);

	return {
		fullscreen,
		enabled,
		toggleFullscreen,
	};
};
