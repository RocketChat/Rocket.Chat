import { api, ServiceClassInternal } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { settings } from '../../settings/server';
import { searchProviderService } from './service';
import { searchEventService } from './events';

class Search extends ServiceClassInternal {
	protected name = 'search';

	protected internal = true;

	constructor() {
		super();

		this.onEvent('watch.users', async ({ clientAction, id, ...rest }) => {
			if (clientAction === 'removed') {
				searchEventService.promoteEvent('user.delete', id, undefined);
				return;
			}

			const user = ('data' in rest && rest.data) || (await Users.findOneById(id));
			searchEventService.promoteEvent('user.save', id, user);
		});

		this.onEvent('watch.rooms', async ({ clientAction, room }) => {
			if (clientAction === 'removed') {
				searchEventService.promoteEvent('room.delete', room._id, undefined);
				return;
			}

			searchEventService.promoteEvent('room.save', room._id, room);
		});
	}
}

const service = new Search();

settings.watch('Search.Provider', async () => {
	if (searchProviderService.activeProvider?.on) {
		api.registerService(service);
	} else {
		await api.destroyService(service);
	}
});
