import { AnchorPortal } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';
import MediaCallPopout from '../views/MediaCallPopout';
import MediaCallWidget from '../views/MediaCallWidget/MediaCallWidget';

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
