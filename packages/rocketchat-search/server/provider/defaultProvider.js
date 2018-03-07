import {searchProviderService} from '../service/providerService';
import SearchProvider from '../model/provider';

/**
 * Implements the default provider (based on mongo db search)
 */
class DefaultProvider extends SearchProvider {

	/**
	 * Enable settings: GlobalSearchEnabled, PageSize
	 */
	constructor() {
		super('defaultProvider');
		this._settings.add('GlobalSearchEnabled', 'boolean', false, {
			i18nDescription:'If_search_returns_result_from_all_accessible_rooms'
		});
		this._settings.add('PageSize', 'int', 10);
	}

	get i18nLabel() {
		return 'Default provider';
	}

	get i18nDescription() {
		return 'You_can_search_using_RegExp_eg';
	}

	/**
	 * {@inheritDoc}
	 * Uses Meteor function 'messageSearch'
	 */
	search(text, context, payload = {}, callback) {

		const _rid = payload.searchAll ? undefined : context.rid;

		const _limit = payload.limit || this._settings.get('PageSize');

		Meteor.call('messageSearch', text, _rid, _limit, callback);
	}
}

//register provider
searchProviderService.register(new DefaultProvider());
