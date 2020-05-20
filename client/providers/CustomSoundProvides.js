import React from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';
import { CustomSoundContext } from '../contexts/CustomSoundContext';


export function CustomSoundProvider({ children }) {
	return <CustomSoundContext.Provider children={children} value={CustomSounds} />;
}
