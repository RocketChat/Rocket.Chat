import { CustomSoundContext, useUserId } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useEffect } from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';
import { sdk } from '../../app/utils/client/lib/SDKClient';

const CustomSoundProvider: FC = ({ children }) => {
	const userId = useUserId();
	useEffect(() => {
		if (!userId) {
			return;
		}
		void CustomSounds.fetchCustomSoundList();
	}, [userId]);

	useEffect(() => {
		if (!userId) {
			return;
		}

		return sdk.stream('notify-all', ['public-info'], ([key, data]) => {
			switch (key) {
				case 'updateCustomSound':
					CustomSounds.update(data[0].soundData);
					break;
				case 'deleteCustomSound':
					CustomSounds.remove(data[0].soundData);
					break;
			}
		}).stop;
	}, [userId]);
	return <CustomSoundContext.Provider children={children} value={CustomSounds} />;
};

export default CustomSoundProvider;
