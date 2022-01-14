import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import { CachedChatSubscription } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { CachedCollectionManager } from '../../../../app/ui-cached-collection';
import { mainReady } from '../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { isSyncReady } from '../../../lib/userData';

const pollReady = (): boolean => {
	const uid = Meteor.userId();
	const subscriptionsReady = CachedChatSubscription.ready.get();
	const settingsReady = settings.cachedCollection.ready.get();
	const userDataReady = isSyncReady.get();
	return !uid || (userDataReady && subscriptionsReady && settingsReady);
};

export const useCollectionsAvailability = (): boolean => {
	const ready = useReactiveValue(pollReady);

	useEffect(() => {
		CachedCollectionManager.syncEnabled = ready;
		mainReady.set(ready);
	}, [ready]);

	return ready;
};
