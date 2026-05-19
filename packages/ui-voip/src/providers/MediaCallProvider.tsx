import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';
import MediaCallViewProvider from './MediaCallViewProvider';
import MediaCallWidgetSlotContext from '../context/MediaCallWidgetSlotContext';

type MediaCallProviderProps = {
	children: ReactNode;
};

const MediaCallProvider = ({ children }: MediaCallProviderProps) => {
	const [slot, setSlot] = useState<HTMLElement | null>(null);
	const slotValue = useMemo(() => ({ slot, inline: slot !== null, setSlot }), [slot]);

	return (
		<MediaCallInstanceProvider>
			<MediaCallWidgetSlotContext.Provider value={slotValue}>
				<MediaCallViewProvider>{children}</MediaCallViewProvider>
			</MediaCallWidgetSlotContext.Provider>
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
