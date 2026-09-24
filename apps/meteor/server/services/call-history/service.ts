import { ServiceClassInternal, type ICallHistoryService } from '@rocket.chat/core-services';
import type { IUser, CallHistoryItem } from '@rocket.chat/core-typings';
import { CallHistory } from '@rocket.chat/models';

import type { MitelConfig } from './mitel/definition';
import { importHistoryForUser } from './mitel/importHistoryForUser';
import { settings } from '../../settings';

export class CallHistoryService extends ServiceClassInternal implements ICallHistoryService {
	protected name = 'call-history';

	public async search(
		uid: IUser['_id'],
		filters: {
			searchTerm?: string;
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
		},
		pagination: {
			count: number;
			offset: number;
			sort?: Record<string, 1 | -1>;
		},
	): Promise<{ items: CallHistoryItem[]; total: number }> {
		const { offset, count, sort } = pagination || {};

		const externalHistoryConfig = this.getExternalCallHistorySettings();
		if (externalHistoryConfig?.host && externalHistoryConfig.username) {
			await importHistoryForUser(uid, externalHistoryConfig);
		}

		// If external history is toggled on, only external entries may be listed
		const type = externalHistoryConfig ? 'mitel' : 'media-call';

		const { cursor, totalCount } = CallHistory.findAllByUserIdAndSearchFilters(
			uid,
			{ ...filters, type },
			{
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
			},
		);
		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			items,
			total,
		};
	}

	private getExternalCallHistorySettings(): MitelConfig | null {
		if (!settings.get('VoIP_TeamCollab_ExternalCallHistory_Enabled')) {
			return null;
		}

		return {
			host: settings.get('VoIP_TeamCollab_ExternalCallHistory_Host'),
			username: settings.get('VoIP_TeamCollab_ExternalCallHistory_User'),
			password: settings.get('VoIP_TeamCollab_ExternalCallHistory_Password'),
			timeout: settings.get('VoIP_TeamCollab_ExternalCallHistory_Timeout'),
		};
	}
}
