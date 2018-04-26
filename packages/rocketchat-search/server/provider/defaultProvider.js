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
			i18nLabel: 'Global_Search',
			alert: 'This feature is currently in beta and could decrease the application performance! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
		});
		this._settings.add('PageSize', 'int', 10, {
			i18nLabel: 'Search_Page_Size'
		});
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
