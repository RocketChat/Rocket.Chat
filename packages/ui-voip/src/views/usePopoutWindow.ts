import { useCallback, useEffect, useRef, useState } from 'react';

const createRootElement = (externalWindow: Window) => {
	const newRoot = externalWindow.document.createElement('div');
	newRoot.style.width = '100%';
	newRoot.style.height = '100%';
	externalWindow.document.body.appendChild(newRoot);
	return newRoot;
};

const copyStylesheets = (externalWindow: Window) => {
	Array.from(document.styleSheets).forEach((stylesheet) => {
		if (stylesheet.href) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = stylesheet.href;
			externalWindow.document.head.appendChild(link);
		} else if (stylesheet?.cssRules?.length > 0) {
			const style = document.createElement('style');
			Array.from(stylesheet.cssRules).forEach((rule) => {
				style.appendChild(document.createTextNode(rule.cssText));
			});
			externalWindow.document.head.appendChild(style);
		}
	});
};

const openExternalWindow = (title: string) => {
	try {
		const externalWindow = window.open('', title, 'width=800,height=500,popup');
		if (!externalWindow) {
			throw new Error('No window was opened');
		}
		copyStylesheets(externalWindow);
		const root = createRootElement(externalWindow);
		return { root, externalWindow };
	} catch (error) {
		// This should maybe throw instead of returning null
		console.error('Failed to open external window', error);
		return null;
	}
};

export type PopoutContainer = { root: HTMLDivElement; ownerDocument: Document };
type PopoutRef = { root: HTMLDivElement; externalWindow: Window; closing: boolean };
type OpenPopoutWindow = (title: string) => void;
type ClosePopoutWindow = () => void;

type UsePopoutWindowReturn = {
	container: PopoutContainer | null;
	openPopoutWindow: OpenPopoutWindow;
	closePopoutWindow: ClosePopoutWindow;
};

export const usePopoutWindow = (onBeforeUnload: () => void): UsePopoutWindowReturn => {
	const popoutRef = useRef<PopoutRef | null>(null);
	const [container, setContainer] = useState<PopoutContainer | null>(null);

	const openPopoutWindow = useCallback(
		(title: string) => {
			if (!!popoutRef.current && popoutRef.current.externalWindow?.closed === false) {
				return;
			}

			const result = openExternalWindow(title);

			if (result) {
				const { root, externalWindow } = result;
				popoutRef.current = { root, externalWindow, closing: false };
				setContainer({ root, ownerDocument: externalWindow.document });
				return;
			}
			onBeforeUnload();
		},
		[onBeforeUnload],
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

	return {
		container,
		openPopoutWindow,
		closePopoutWindow,
	};
};
