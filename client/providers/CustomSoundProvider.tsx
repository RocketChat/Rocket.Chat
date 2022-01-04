import React, { FC } from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';
import { CustomSoundContext } from '../contexts/CustomSoundContext';

const CustomSoundProvider: FC = ({ children }) => <CustomSoundContext.Provider children={children} value={CustomSounds} />;

export default CustomSoundProvider;
