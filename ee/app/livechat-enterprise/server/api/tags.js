import { API } from '../../../../../app/api/server';
import { findTags, findTagById, findTagsToAutocomplete } from './lib/tags';

API.v1.addRoute('livechat/tags.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findTags({
			userId: this.userId,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('livechat/tags.getOne', { authRequired: true }, {
	get() {
		const { tagId } = this.queryParams;

		return API.v1.success(Promise.await(findTagById({
			userId: this.userId,
			tagId,
		})));
	},
});

API.v1.addRoute('livechat/tags.autocomplete', { authRequired: true }, {
	get() {
		const { selector } = this.queryParams;
		if (!selector) {
			return API.v1.failure('The \'selector\' param is required');
		}

		return API.v1.success(Promise.await(findTagsToAutocomplete({
			uid: this.userId,
			selector: JSON.parse(selector),
		})));
	},
});

