import { useOwnerDocument } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { RefCallback } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type FSResult = {
	/** whether the target is fullscreen: the element `targetRef` is on, or else any element in the current document */
	fullscreen: boolean;
	/** wether requestFullscreen is supported*/
	enabled: boolean;
};

type FullScreenToggleReturn = FSResult & {
	/** Shows the target fullscreen, or leaves fullscreen if it already is */
	toggleFullscreen: () => Promise<void>;
	/** Attach it to show that element fullscreen instead of the whole document */
	targetRef: RefCallback<HTMLElement>;
};

const getFullscreenState = (ownerDocument: Document, target: HTMLElement | null): FSResult => {
	const { fullscreenElement } = ownerDocument;
	return { fullscreen: target ? fullscreenElement === target : Boolean(fullscreenElement), enabled: ownerDocument.fullscreenEnabled };
};

/**
 * @description Hook to transition and track full screen transitioning
 * 	- Uses {useOwnerDocument} from fuselage, take into consideration wrapped `OwnerDocument` contexts when using to ensure correct behaviour.
 *  - Caveat: Triggering fullscreen through `F11` or Platform specific window controls is not identifiable. Also, `exitFullscreen` cannot revert this action, so the states returned by this hook might not accurately depict the current window state.
 */
export const useFullscreenToggle = (): FullScreenToggleReturn => {
	const { t } = useTranslation();
	const { document: ownerDocument } = useOwnerDocument();
	const target = useRef<HTMLElement | null>(null);
	const [{ fullscreen, enabled }, setState] = useState<FSResult>(() => getFullscreenState(ownerDocument, target.current));
	const dispatchToastMessage = useToastMessageDispatch();

	const update = useCallback(() => {
		const next = getFullscreenState(ownerDocument, target.current);
		setState((prev) => (prev.fullscreen === next.fullscreen && prev.enabled === next.enabled ? prev : next));
	}, [ownerDocument]);

	useEffect(() => {
		ownerDocument.addEventListener('fullscreenchange', update);
		return () => {
			ownerDocument.removeEventListener('fullscreenchange', update);
		};
	}, [ownerDocument, update]);

	const targetRef = useCallback(
		(node: HTMLElement) => {
			target.current = node;
			update();

			return () => {
				target.current = null;
				update();
			};
		},
		[update],
	);

	const toggleFullscreen = useCallback(async () => {
		const { fullscreen, enabled } = getFullscreenState(ownerDocument, target.current);
		if (!enabled) {
			return;
		}

		try {
			if (fullscreen) {
				await ownerDocument.exitFullscreen();
			} else {
				await (target.current ?? ownerDocument.documentElement).requestFullscreen();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Fullscreen_failed_to_switch_not_allowed') });
		}
	}, [ownerDocument, dispatchToastMessage, t]);

	return {
		fullscreen,
		enabled,
		toggleFullscreen,
		targetRef,
	};
};
