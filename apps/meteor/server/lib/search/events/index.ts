import type { IMessage } from '@rocket.chat/core-typings';

import { EventService } from './EventService';
import { settings } from '../../../../app/settings/server';
import { callbacks } from '../../callbacks';
import { searchProviderService } from '../service';

export const searchEventService = new EventService();

/**
 * Listen to message changes via Hooks
 */
function afterSaveMessage(m: IMessage) {
	searchEventService.promoteEvent('message.save', m._id, m);
	return m;
}

function afterDeleteMessage(m: IMessage) {
	searchEventService.promoteEvent('message.delete', m._id);
	return m;
}

settings.watch('Search.Provider', () => {
	if (searchProviderService.activeProvider?.on) {
		callbacks.add('afterSaveMessage', afterSaveMessage, callbacks.priority.MEDIUM, 'search-events');
		callbacks.add('afterDeleteMessage', afterDeleteMessage, callbacks.priority.MEDIUM, 'search-events-delete');
		return;
	}

	callbacks.remove('afterSaveMessage', 'search-events');
	callbacks.remove('afterDeleteMessage', 'search-events-delete');
});
