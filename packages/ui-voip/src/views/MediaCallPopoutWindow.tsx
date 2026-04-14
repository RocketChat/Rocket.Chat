import { StyleOptions as FuselageStyleOptions } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { StyledOptions } from '@rocket.chat/styled';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type MediaCallPopoutWindowProps = {
	children: ReactNode;
	onClose: () => void;
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

const MediaCallPopoutWindow = ({ children, onClose }: MediaCallPopoutWindowProps) => {
	const [container, setContainer] = useState<{ root: HTMLDivElement; externalWindow: Window } | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const triggerClose = useStableCallback(onClose);

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

		const handleUnload = () => triggerClose();
		container?.externalWindow.addEventListener('beforeunload', handleUnload);

		return () => {
			timeoutRef.current = setTimeout(() => {
				container?.externalWindow.removeEventListener('beforeunload', handleUnload);
				container?.externalWindow.close();
				triggerClose();
			}, 400);
		};
	}, [container?.externalWindow, triggerClose]);

	const contextValue = useMemo(() => ({ document: container?.externalWindow.document }), [container?.externalWindow.document]);

	if (!container) {
		return null;
	}

	return (
		<FuselageStyleOptions.Provider value={contextValue}>
			<StyledOptions.Provider value={contextValue}>{createPortal(children, container.root)}</StyledOptions.Provider>
		</FuselageStyleOptions.Provider>
	);
};

export default MediaCallPopoutWindow;
