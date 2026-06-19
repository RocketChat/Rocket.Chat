import { useThemeMode } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const createRootElement = (externalWindow: Window) => {
	const landingPageRoot = externalWindow.document.querySelector('#root');
	if (!landingPageRoot) {
		throw new Error('usePopoutWindow - createRootElement - landingPageRoot not found');
	}

	const newRoot = externalWindow.document.createElement('div');
	newRoot.style.width = '100%';
	newRoot.style.height = '100%';

	landingPageRoot.appendChild(newRoot);

	return newRoot;
};

const replaceWithTranslationString = (t: TFunction, externalDocument: Document) => {
	externalDocument.querySelectorAll('[data-i18n]').forEach((el) => {
		el.textContent = t(el.getAttribute('data-i18n') as string);
	});
};

const changeTheme = (ownerDocument: Document, theme?: string) => {
	if (theme) {
		ownerDocument.documentElement.setAttribute('data-color-scheme', theme);
	} else {
		ownerDocument.documentElement.removeAttribute('data-color-scheme');
	}
};

const openExternalWindow = async (callId: string, theme: string) => {
	const externalWindow = window.open('/voice-call-popup.html', callId, 'width=800,height=500,popup');

	if (!externalWindow) {
		throw new Error('No window was opened');
	}

	changeTheme(externalWindow.document, theme);

	const root = await new Promise<HTMLDivElement>((resolve, reject) => {
		let createRootTimeout: NodeJS.Timeout | null = null;
		let attempt = 1;
		let created = false;
		const attemptCreateRoot = () => {
			// In case `onload` runs after the root has been created already
			if (created === true) {
				return;
			}

			if (createRootTimeout) {
				clearTimeout(createRootTimeout);
			}

			try {
				const root = createRootElement(externalWindow);
				created = true;
				resolve(root);
			} catch (error) {
				// arround ~ 5 seconds total timeout
				if (attempt > 9) {
					reject(error as Error);
					externalWindow.close();
					return;
				}
				attempt += 1;
				createRootTimeout = setTimeout(attemptCreateRoot, attempt * 100);
			}
		};

		// DOMContentLoaded nor readyState can be used because they have already fired
		// onload takes longer to fire but could also have already been fired
		externalWindow.onload = () => {
			attemptCreateRoot();
		};

		// If onload takes too long to start it could mean it has already fired
		// So we start polling for the element. It could still not have been fired.
		setTimeout(() => {
			attemptCreateRoot();
		}, 500);
	});

	return { root, externalWindow };
};

export type PopoutContainer = { root: HTMLDivElement; ownerDocument: Document };
type PopoutRef = { root: HTMLDivElement; externalWindow: Window; closing: boolean };
type OpenPopoutWindow = (callId: string) => Promise<void>;
type ClosePopoutWindow = () => void;

type UsePopoutWindowReturn = {
	container: PopoutContainer | null;
	openPopoutWindow: OpenPopoutWindow;
	closePopoutWindow: ClosePopoutWindow;
};

export const usePopoutWindow = (onBeforeUnload: () => void): UsePopoutWindowReturn => {
	const popoutRef = useRef<PopoutRef | null>(null);
	const [container, setContainer] = useState<PopoutContainer | null>(null);
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [, , theme] = useThemeMode();

	const openPopoutWindow = useCallback(
		async (callId: string) => {
			if (!!popoutRef.current && popoutRef.current.externalWindow?.closed === false) {
				return;
			}

			try {
				const result = await openExternalWindow(callId, theme);
				if (!result) {
					onBeforeUnload();
				}
				const { root, externalWindow } = result;
				popoutRef.current = { root, externalWindow, closing: false };
				setContainer({ root, ownerDocument: externalWindow.document });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_open_call_window') });
				console.error('Failed to open popout', error);
				onBeforeUnload();
			}
		},
		[onBeforeUnload, theme, dispatchToastMessage, t],
	);

	const closePopoutWindow = useCallback(() => {
		if (popoutRef.current !== null && popoutRef.current?.externalWindow?.closed !== true && !popoutRef.current.closing) {
			popoutRef.current.externalWindow.close();
			popoutRef.current = null;
			setContainer(null);
		}
	}, []);

	useEffect(() => {
		const externalWindow = popoutRef.current?.externalWindow;
		if (!externalWindow || !container) return;

		const handleBeforeUnload = () => {
			if (popoutRef.current) {
				popoutRef.current.closing = true;
			}
			onBeforeUnload();
			popoutRef.current = null;
			setContainer(null);
		};

		externalWindow.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('beforeunload', closePopoutWindow);

		return () => {
			externalWindow.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('beforeunload', closePopoutWindow);
		};
	}, [container, onBeforeUnload, closePopoutWindow]);

	useEffect(() => {
		if (!container) {
			return;
		}
		replaceWithTranslationString(t, container.ownerDocument);
	}, [container, t]);

	useEffect(() => {
		if (!container) {
			return;
		}
		changeTheme(container.ownerDocument, theme);
	}, [container, theme]);

	return {
		container,
		openPopoutWindow,
		closePopoutWindow,
	};
};
