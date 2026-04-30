import { Box, TargetDocument as FuselageTargetDocument } from '@rocket.chat/fuselage';
import { TargetDocument as StyledTargetDocument } from '@rocket.chat/styled';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { useMediaCallInstance } from '../context';
import MediaCallPopoutView from './MediaCallPopoutView';
import type { AvailableViews } from '../context/MediaCallInstanceContext';

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

const MediaCallPopoutWindow = () => {
	const [container, setContainer] = useState<{ root: HTMLDivElement; externalWindow: Window } | null>(null);
	const { setCurrentViews } = useMediaCallInstance();

	const closePopout = useCallback(
		(windowClosed = false) => {
			setCurrentViews((prev) => {
				if (!prev.has('popout')) {
					return prev;
				}

				prev.delete('popout');
				return new Set<AvailableViews>(prev);
			});
			if (!windowClosed) {
				container?.externalWindow.close();
			}
		},
		[container?.externalWindow, setCurrentViews],
	);

	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();
	const ownUser = useMemo(() => {
		return {
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		};
	}, [displayName, getUserAvatarPath, user?._id]);

	useLayoutEffect(() => {
		setContainer((prev) => {
			if (prev?.externalWindow && prev?.root) {
				return prev;
			}

			const externalWindow = !prev?.externalWindow ? openExternalWindow('Call with Peer X') : prev?.externalWindow;

			if (!externalWindow) {
				closePopout(true);
				return null;
			}

			const root = createRootElement(externalWindow);

			return { root, externalWindow };
		});
	}, [closePopout]);

	useEffect(() => {
		const handleBeforeUnload = () => closePopout(true);
		container?.externalWindow.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			container?.externalWindow.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [container?.externalWindow, closePopout]);

	useLayoutEffect(() => {
		return () => {
			// Since this happens during cleanup, we need the most up-to-date state of the current views
			// to avoid closing the window prematurely
			// so we use the setter functions "previous value", as it should contain the newest state.
			// If we were to use the current state, it would always be outdated on the cleanup.
			setCurrentViews((prev) => {
				if (!prev.has('popout')) {
					closePopout(false);
				}
				return prev;
			});
		};
	}, [closePopout, setCurrentViews]);

	const contextValue = useMemo(() => ({ document: container?.externalWindow.document || document }), [container?.externalWindow.document]);

	if (!container) {
		return null;
	}

	return (
		<FuselageTargetDocument.Provider value={contextValue}>
			<StyledTargetDocument.Provider value={contextValue}>
				{createPortal(
					<Box w='full' h='full' display='flex' flexDirection='column' justifyContent='space-between'>
						<MediaCallPopoutView user={ownUser} onClickClosePopout={() => closePopout(false)} />
					</Box>,
					container.root,
				)}
			</StyledTargetDocument.Provider>
		</FuselageTargetDocument.Provider>
	);
};

export default MediaCallPopoutWindow;
