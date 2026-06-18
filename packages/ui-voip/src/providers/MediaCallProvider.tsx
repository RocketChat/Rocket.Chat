import { AnchorPortal } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';
import { MediaCallWidget } from '../views';
import MediaCallPopout from '../views/MediaCallPopout';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	return (
		<MediaCallInstanceProvider>
			<MediaCallViewProvider>
				<AnchorPortal id='rcx-media-call-widget-portal'>
					<MediaCallWidget />
				</AnchorPortal>
			</MediaCallViewProvider>
			<MediaCallPopout />
			{children}
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
