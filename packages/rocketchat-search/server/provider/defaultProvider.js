import {searchProviderService} from '../service/providerService';
import SearchProvider from '../service/provider';

class DefaultProvider extends SearchProvider {

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
		return 'The default provider uses mongodb for search';
	}

	search(text, context, payload = {}, callback) {

		const _rid = payload.searchAll ? undefined : context.rid;

		const _limit = payload.limit || this._settings.get('PageSize');

		Meteor.call('messageSearch', text, _rid, _limit, (err, result)=>{
			Meteor.setTimeout(()=>{
				callback(err, result);
			}, 2000);
		});
	}
}

searchProviderService.register(new DefaultProvider());
