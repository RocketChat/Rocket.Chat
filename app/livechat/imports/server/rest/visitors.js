
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { LivechatRooms, Messages } from '../../../../models/server';
import { normalizeMessagesForUser } from '../../../../utils/server/lib/normalizeMessagesForUser';
import { findVisitorInfo, findVisitedPages, findChatHistory, searchChats, findVisitorsToAutocomplete, findVisitorsByEmailOrPhoneOrNameOrUsername } from '../../../server/api/lib/visitors';
import { canAccessRoom } from '../../../../authorization/server';

API.v1.addRoute('livechat/visitors.info', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			visitorId: String,
		});

		const visitor = Promise.await(findVisitorInfo({ userId: this.userId, visitorId: this.queryParams.visitorId }));

		return API.v1.success(visitor);
	},
});

API.v1.addRoute('livechat/visitors.pagesVisited/:roomId', { authRequired: true }, {
	get() {
		check(this.urlParams, {
			roomId: String,
		});
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();


		const pages = Promise.await(findVisitedPages({
			userId: this.userId,
			roomId: this.urlParams.roomId,
			pagination: {
				offset,
				count,
				sort,
			},
		}));

		return API.v1.success(pages);
	},
});

API.v1.addRoute('livechat/visitors.chatHistory/room/:roomId/visitor/:visitorId', { authRequired: true }, {
	get() {
		check(this.urlParams, {
			visitorId: String,
			roomId: String,
		});
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const history = Promise.await(findChatHistory({
			userId: this.userId,
			roomId: this.urlParams.roomId,
			visitorId: this.urlParams.visitorId,
			pagination: {
				offset,
				count,
				sort,
			},
		}));

		return API.v1.success(history);
	},
});

API.v1.addRoute('livechat/:rid/messages', { authRequired: true, permissionsRequired: ['view-l-room'] }, {
	get() {
		check(this.urlParams, {
			rid: String,
		});

		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		const room = LivechatRooms.findOneById(this.urlParams.rid);

		if (!room) {
			throw new Error('invalid-room');
		}

		if (!canAccessRoom(room, this.user)) {
			throw new Error('not-allowed');
		}

		const cursor = Messages.findLivechatClosedMessages(this.urlParams.rid, {
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
		});

		const total = cursor.count();

		const messages = cursor.fetch();

		return API.v1.success({
			messages: normalizeMessagesForUser(messages, this.userId),
			offset,
			count,
			total,
		});
	},
});

API.v1.addRoute('livechat/visitors.searchChats/room/:roomId/visitor/:visitorId', { authRequired: true }, {
	get() {
		check(this.urlParams, {
			visitorId: String,
			roomId: String,
		});
		const { roomId, visitorId } = this.urlParams;
		const { searchText, closedChatsOnly, servedChatsOnly } = this.queryParams;
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const history = Promise.await(searchChats({
			userId: this.userId,
			roomId,
			visitorId,
			searchText,
			closedChatsOnly,
			servedChatsOnly,
			pagination: {
				offset,
				count,
				sort,
			},
		}));
		return API.v1.success(history);
	},
});

API.v1.addRoute('livechat/visitors.autocomplete', { authRequired: true }, {
	get() {
		const { selector } = this.queryParams;
		if (!selector) {
			return API.v1.failure('The \'selector\' param is required');
		}

		return API.v1.success(Promise.await(findVisitorsToAutocomplete({
			userId: this.userId,
			selector: JSON.parse(selector),
		})));
	},
});

API.v1.addRoute('livechat/visitors.search', { authRequired: true }, {
	get() {
		const { term } = this.requestParams();

		check(term, Match.Maybe(String));

		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findVisitorsByEmailOrPhoneOrNameOrUsername({
			userId: this.userId,
			term,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});
