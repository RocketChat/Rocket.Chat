import { TargetDocument as FuselageTargetDocument } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { TargetDocument as StyledTargetDocument } from '@rocket.chat/styled';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type MediaCallPopoutWindowProps = {
	children: ReactNode;
	restoreDefaultView: () => void;
};

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
		return externalWindow;
	} catch (error) {
		console.error('Failed to open external window', error);
		return null;
	}
};

const MediaCallPopoutWindow = ({ children, restoreDefaultView }: MediaCallPopoutWindowProps) => {
	const [container, setContainer] = useState<{ root: HTMLDivElement; externalWindow: Window } | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const triggerClose = useStableCallback(restoreDefaultView);

	useEffect(() => {
		setContainer((prev) => {
			if (prev?.externalWindow && prev?.root) {
				return prev;
			}

			const externalWindow = !prev?.externalWindow ? openExternalWindow('Call with Peer X') : prev?.externalWindow;

			if (!externalWindow) {
				triggerClose();
				return null;
			}

			const root = createRootElement(externalWindow);

			return { root, externalWindow };
		});
	}, [triggerClose]);

	useEffect(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		container?.externalWindow.addEventListener('beforeunload', triggerClose);
		window.addEventListener('beforeunload', triggerClose);

		return () => {
			timeoutRef.current = setTimeout(() => {
				window.removeEventListener('beforeunload', triggerClose);
				container?.externalWindow.removeEventListener('beforeunload', triggerClose);
				container?.externalWindow.close();
				triggerClose();
			}, 400);
		};
	}, [container?.externalWindow, triggerClose]);

	const contextValue = useMemo(() => ({ document: container?.externalWindow.document || document }), [container?.externalWindow.document]);

	if (!container) {
		return null;
	}

	return (
		<FuselageTargetDocument.Provider value={contextValue}>
			<StyledTargetDocument.Provider value={contextValue}>{createPortal(children, container.root)}</StyledTargetDocument.Provider>
		</FuselageTargetDocument.Provider>
	);
};

export default MediaCallPopoutWindow;
