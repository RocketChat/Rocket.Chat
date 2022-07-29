import { useContext } from 'react';

import { CustomSoundContext, CustomSoundContextValue } from '../CustomSoundContext';

export const useCustomSound = (): CustomSoundContextValue => useContext(CustomSoundContext);
