import { useCallback } from 'react';
import { TAPi18next } from 'meteor/rocketchat:tap-i18n';

import { Utilities } from '../../../../app/apps/lib/misc/Utilities';


export const useGetAppKey = (appId) => useCallback((key) => {
	const appKey = Utilities.getI18nKeyForApp(key, appId);

	return TAPi18next.exists(`project:${ appKey }`) ? appKey : key;
}, [appId]);
