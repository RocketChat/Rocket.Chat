import { useContext } from 'react';

import type { CustomSoundContextValue } from '../CustomSoundContext.js';
import { CustomSoundContext } from '../CustomSoundContext.js';

export const useCustomSound = (): CustomSoundContextValue => useContext(CustomSoundContext);
