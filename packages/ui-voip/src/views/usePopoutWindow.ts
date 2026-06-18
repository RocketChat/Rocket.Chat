import { useThemeMode } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const createRootElement = async (externalWindow: Window) => {
	const newRoot = externalWindow.document.createElement('div');
	newRoot.style.width = '100%';
	newRoot.style.height = '100%';

	const landingPageRoot = externalWindow.document.getElementById('root');
	if (!landingPageRoot) {
		externalWindow.close();
		throw new Error('usePopoutWindow - createRootElement - landingPageRoot not found');
	}

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

	await new Promise((resolve) => {
		if (externalWindow.document.readyState === 'loading') {
			externalWindow.document.onreadystatechange = () => {
				if (externalWindow.document.readyState === 'complete') {
					resolve(true);
				}
			};
		}

		externalWindow.addEventListener('DOMContentLoaded', () => {
			resolve(true);
		});

		externalWindow.document.onload = () => {
			resolve(true);
		};

		// In case the other listeners never finish, resolve the promise so it isn't stuck forever
		const LISTENERS_TIMEOUT = 500;
		setTimeout(() => resolve(true), LISTENERS_TIMEOUT);
	});

	const root = await createRootElement(externalWindow);
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
