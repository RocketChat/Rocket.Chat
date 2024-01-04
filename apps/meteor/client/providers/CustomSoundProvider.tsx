import { CustomSoundContext, useUserId, useStream } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useEffect } from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';

const CustomSoundProvider: FC = ({ children }) => {
	const userId = useUserId();
	useEffect(() => {
		if (!userId) {
			return;
		}
		void CustomSounds.fetchCustomSoundList();
	}, [userId]);

	const streamAll = useStream('notify-all');

	useEffect(() => {
		if (!userId) {
			return;
		}

		return streamAll('public-info', ([key, data]) => {
			switch (key) {
				case 'updateCustomSound':
					CustomSounds.update(data[0].soundData);
					break;
				case 'deleteCustomSound':
					CustomSounds.remove(data[0].soundData);
					break;
			}
		});
	}, [userId, streamAll]);
	return <CustomSoundContext.Provider children={children} value={CustomSounds} />;
};

export default CustomSoundProvider;
