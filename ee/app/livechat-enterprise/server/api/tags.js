import { API } from '../../../../../server/api';
import { findTags, findTagById } from './lib/tags';

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
