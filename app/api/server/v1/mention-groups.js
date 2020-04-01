import { API } from '../api';
import { findMentionGroupAutocomplete } from '../lib/mentionGroups';

API.v1.addRoute('mentionGroups.autocomplete', { authRequired: true }, {
	get() {
		const { selector } = this.queryParams;
		if (!selector) {
			return API.v1.failure('The \'selector\' param is required');
		}

		return API.v1.success(Promise.await(findMentionGroupAutocomplete({
			uid: this.userId,
			selector: JSON.parse(selector),
		})));
	},
});
