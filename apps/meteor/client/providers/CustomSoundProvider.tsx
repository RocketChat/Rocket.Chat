import { CustomSoundContext } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';

const CustomSoundProvider: FC = ({ children }) => <CustomSoundContext.Provider children={children} value={CustomSounds} />;

export default CustomSoundProvider;
