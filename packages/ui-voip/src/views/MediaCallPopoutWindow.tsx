import { Box, OwnerDocument as FuselageOwnerDocument } from '@rocket.chat/fuselage';
import { OwnerDocument as StyledOwnerDocument } from '@rocket.chat/styled';
import { ModalProvider, ModalRegion, TooltipProvider } from '@rocket.chat/ui-client';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import MediaCallPopoutView from './MediaCallPopoutView.js';
import type { PopoutContainer } from './usePopoutWindow.js';
import { useMediaCallViewer } from '../hooks/useMediaCallViewer.js';
import MediaCallViewProvider from '../providers/MediaCallViewProvider.js';

export type MediaCallPopoutWindowProps = {
	container: PopoutContainer;
	onClosePopout: () => void;
};
const MediaCallPopoutWindow = ({ container, onClosePopout }: MediaCallPopoutWindowProps) => {
	const [region] = useState(() => Symbol());

	const ownUser = useMediaCallViewer();

	const { root, ownerDocument } = container;

	const contextValue = useMemo(() => ({ document: ownerDocument }), [ownerDocument]);

	return (
		<ModalProvider region={region}>
			<MediaCallViewProvider>
				<FuselageOwnerDocument.Provider value={contextValue}>
					<StyledOwnerDocument.Provider value={contextValue}>
						<TooltipProvider ownerDocument={ownerDocument}>
							{createPortal(
								<Box width='full' height='full' display='flex' flexDirection='column' justifyContent='space-between'>
									<MediaCallPopoutView user={ownUser} onClickClosePopout={onClosePopout} />
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
