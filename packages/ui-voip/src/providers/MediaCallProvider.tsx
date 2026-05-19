import { AnchorPortal } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';
import MediaCallWidgetSlotContext from '../context/MediaCallWidgetSlotContext';
import { MediaCallWidget } from '../views';
import MediaCallPopout from '../views/MediaCallPopout';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	const [slot, setSlot] = useState<HTMLElement | null>(null);
	const slotValue = useMemo(() => ({ slot, inline: slot !== null, setSlot }), [slot]);

	return (
		<MediaCallInstanceProvider>
			<MediaCallWidgetSlotContext.Provider value={slotValue}>
				<MediaCallViewProvider>
					{slot ? (
						createPortal(<MediaCallWidget />, slot)
					) : (
						<AnchorPortal id='rcx-media-call-widget-portal'>
							<MediaCallWidget />
						</AnchorPortal>
					)}
				</MediaCallViewProvider>
				<MediaCallPopout />
				{children}
			</MediaCallWidgetSlotContext.Provider>
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
