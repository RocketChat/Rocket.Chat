import { Users } from '../../models/server';
import { settings } from '../../settings/server';
import { searchProviderService } from './service/providerService';
import { ServiceClassInternal } from '../../../server/sdk/types/ServiceClass';
import { api } from '../../../server/sdk/api';
import { searchEventService } from './events/events';

class Search extends ServiceClassInternal {
	protected name = 'search';

	protected internal = true;

	constructor() {
		super();

		this.onEvent('watch.users', async ({ clientAction, data, id }) => {
			if (clientAction === 'removed') {
				searchEventService.promoteEvent('user.delete', id, undefined);
				return;
			}

			const user = data ?? Users.findOneById(id);
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

settings.watch('Search.Provider', () => {
	if (searchProviderService.activeProvider?.on) {
		api.registerService(service);
	} else {
		api.destroyService(service);
	}
});
