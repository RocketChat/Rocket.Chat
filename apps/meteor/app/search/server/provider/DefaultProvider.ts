import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import type { IRawSearchResult } from '../model/ISearchResult';
import { SearchProvider } from '../model/SearchProvider';

/**
 * Implements the default provider (based on mongo db search)
 */
export class DefaultProvider extends SearchProvider<{ searchAll?: boolean; limit?: number }> {
	/**
	 * Enable settings: GlobalSearchEnabled, PageSize
	 */
	constructor() {
		super('defaultProvider');
		this._settings.add('GlobalSearchEnabled', 'boolean', false, {
			i18nLabel: 'Global_Search',
			alert: 'This feature is currently in beta and could decrease the application performance',
		});
		this._settings.add('PageSize', 'int', 10, {
			i18nLabel: 'Search_Page_Size',
		});
	}

	get i18nLabel() {
		return 'Default_provider' as const;
	}

	get i18nDescription() {
		return 'You_can_search_using_RegExp_eg' as const;
	}

	/**
	 * Uses Meteor function 'messageSearch'
	 */
	search(
		text: string,
		context: { uid?: IUser['_id']; rid: IRoom['_id'] },
		payload: { searchAll?: boolean; limit?: number } = {},
		callback?: (error: Error | null, result: IRawSearchResult) => void,
	): void {
		const _rid = payload.searchAll ? undefined : context.rid;

		const _limit = payload.limit || this._settings.get<number>('PageSize');

		Meteor.call('messageSearch', text, _rid, _limit, callback);
	}
}
