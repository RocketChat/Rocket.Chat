import { CustomSoundContext } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';

const CustomSoundProvider: FC = ({ children }) => {
	const contextValue = {
		play: CustomSounds.play,
		pause: CustomSounds.pause,
		getList: CustomSounds.getList,
		isPlaying: CustomSounds.isPlaying,
	};

	return <CustomSoundContext.Provider children={children} value={contextValue} />;
};

export default CustomSoundProvider;
