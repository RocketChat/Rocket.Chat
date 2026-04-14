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

const MediaCallPopoutWindow = ({ children, onClose }: MediaCallPopoutWindowProps) => {
	const [container, setContainer] = useState<{ root: HTMLDivElement; externalWindow: Window } | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const triggerClose = useStableCallback(onClose);

	useEffect(() => {
		if (container?.externalWindow.closed === false) {
			return;
		}

		let externalWindow: Window | null;
		try {
			// TODO: use peer name instead of 'Call with Peer X'
			externalWindow = window.open('', 'Call with Peer X', 'width=800,height=500,popup');
		} catch (error) {
			console.error('Failed to open external window', error);
			triggerClose();
			return;
		}

		if (!externalWindow) {
			triggerClose();
			return;
		}

		const win = externalWindow;

		const root = win.document.createElement('div');
		win.document.body.appendChild(root);
		root.style.width = '100%';
		root.style.height = '100%';

		Array.from(document.styleSheets).forEach((stylesheet) => {
			if (stylesheet.href) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = stylesheet.href;
				win.document.head.appendChild(link);
			} else if (stylesheet?.cssRules?.length > 0) {
				const style = document.createElement('style');
				Array.from(stylesheet.cssRules).forEach((rule) => {
					style.appendChild(document.createTextNode(rule.cssText));
				});
				win.document.head.appendChild(style);
			}
		});

		setContainer({ root, externalWindow: win });
	}, [triggerClose, container?.externalWindow.closed]);

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
