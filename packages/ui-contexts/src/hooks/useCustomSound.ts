import { useContext } from 'react';

import { CustomSoundContext, CustomSoundContextValue } from '../CustomSoundContext';

export const useCustomSound = (): CustomSoundContextValue => {
	const result = useContext(CustomSoundContext);
	if (result === undefined) {
		throw new Error('useCustomSound must be used within a CustomSoundContext');
	}
	return result;
};
