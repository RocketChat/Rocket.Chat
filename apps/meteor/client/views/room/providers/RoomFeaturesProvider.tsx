import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { RoomFeaturesContext } from '../contexts/RoomFeaturesContext';

type RoomFeaturesProviderProps = {
	children?: ReactNode;
};

/** Reads once, for a whole room, the workspace features its header, toolbox and composer depend on */
const RoomFeaturesProvider = ({ children }: RoomFeaturesProviderProps) => {
	const e2eEnabled = useSetting('E2E_Enable', false);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);
	const favoritesEnabled = useSetting('Favorite_Rooms', true);
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled', false);

	const value = useMemo(
		() => ({ e2eEnabled, unencryptedMessagesAllowed, favoritesEnabled, autoTranslateEnabled }),
		[e2eEnabled, unencryptedMessagesAllowed, favoritesEnabled, autoTranslateEnabled],
	);

	return <RoomFeaturesContext.Provider value={value}>{children}</RoomFeaturesContext.Provider>;
};

export default RoomFeaturesProvider;
