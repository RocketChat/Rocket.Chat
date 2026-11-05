import { AnchorPortal } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider.js';
import MediaCallViewProvider from './MediaCallViewProvider.js';
import MediaCallPopout from '../views/MediaCallPopout.js';
import { MediaCallWidget } from '../views/index.js';

export type MediaCallProviderProps = {
	children: ReactNode;
	enabled?: boolean;
};

const MediaCallProvider = ({ children, enabled = true }: MediaCallProviderProps) => {
	return (
		<MediaCallInstanceProvider enabled={enabled}>
			{enabled && (
				<>
					<MediaCallViewProvider>
						<AnchorPortal id='rcx-media-call-widget-portal'>
							<MediaCallWidget />
						</AnchorPortal>
					</MediaCallViewProvider>
					<MediaCallPopout />
				</>
			)}
			{children}
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
