import { Box, OwnerDocument as FuselageOwnerDocument } from '@rocket.chat/fuselage';
import { OwnerDocument as StyledOwnerDocument } from '@rocket.chat/styled';
import { ModalProvider, ModalRegion, TooltipProvider, useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import MediaCallPopoutView from './MediaCallPopoutView';
import type { PopoutContainer } from './usePopoutWindow';
import MediaCallViewProvider from '../providers/MediaCallViewProvider';

type MediaCallPopoutWindowProps = {
	container: PopoutContainer;
	onClosePopout: () => void;
};
const MediaCallPopoutWindow = ({ container, onClosePopout }: MediaCallPopoutWindowProps) => {
	const [fullscreen, setFullscreen] = useState(false);
	const [region] = useState(() => Symbol());

	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();
	const ownUser = useMemo(() => {
		return {
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		};
	}, [displayName, getUserAvatarPath, user?._id]);

	const { root, ownerDocument } = container;

	const onClickFullscreen = useCallback(() => {
		const requestFullScreen = async () => {
			try {
				if (!fullscreen) {
					await ownerDocument.documentElement.requestFullscreen();
					setFullscreen(true);
				} else {
					await ownerDocument.exitFullscreen();
					setFullscreen(false);
				}
			} catch (error) {
				console.error('Error requesting fullscreen', error);
			}
		};
		void requestFullScreen();
	}, [ownerDocument, fullscreen]);

	const contextValue = useMemo(() => ({ document: ownerDocument }), [ownerDocument]);

	return (
		<ModalProvider region={region}>
			<MediaCallViewProvider>
				<FuselageOwnerDocument.Provider value={contextValue}>
					<StyledOwnerDocument.Provider value={contextValue}>
						<TooltipProvider ownerDocument={ownerDocument}>
							{createPortal(
								<Box w='full' h='full' display='flex' flexDirection='column' justifyContent='space-between'>
									<MediaCallPopoutView
										user={ownUser}
										onClickClosePopout={onClosePopout}
										onClickFullscreen={onClickFullscreen}
										fullscreen={fullscreen}
									/>
									<ModalRegion />
								</Box>,
								root,
							)}
						</TooltipProvider>
					</StyledOwnerDocument.Provider>
				</FuselageOwnerDocument.Provider>
			</MediaCallViewProvider>
		</ModalProvider>
	);
};

export default MediaCallPopoutWindow;
