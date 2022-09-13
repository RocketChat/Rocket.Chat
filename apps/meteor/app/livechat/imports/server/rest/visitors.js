import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import {
	findVisitorInfo,
	findVisitedPages,
	findChatHistory,
	searchChats,
	findVisitorsToAutocomplete,
	findVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField,
} from '../../../server/api/lib/visitors';

API.v1.addRoute(
	'livechat/visitors.info',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			check(this.queryParams, {
				visitorId: String,
			});

			const visitor = await findVisitorInfo({ visitorId: this.queryParams.visitorId });

			return API.v1.success(visitor);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.pagesVisited/:roomId',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			check(this.urlParams, {
				roomId: String,
			});
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const pages = await findVisitedPages({
				roomId: this.urlParams.roomId,
				pagination: {
					offset,
					count,
					sort,
				},
			});
			return API.v1.success(pages);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.chatHistory/room/:roomId/visitor/:visitorId',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			check(this.urlParams, {
				visitorId: String,
				roomId: String,
			});
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const history = await findChatHistory({
				userId: this.userId,
				roomId: this.urlParams.roomId,
				visitorId: this.urlParams.visitorId,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(history);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.searchChats/room/:roomId/visitor/:visitorId',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			check(this.urlParams, {
				visitorId: String,
				roomId: String,
			});
			const { roomId, visitorId } = this.urlParams;
			const { searchText, closedChatsOnly, servedChatsOnly } = this.queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const history = await searchChats({
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
			});
			return API.v1.success(history);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.autocomplete',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			const { selector } = this.queryParams;
			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			return API.v1.success(
				await findVisitorsToAutocomplete({
					userId: this.userId,
					selector: JSON.parse(selector),
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.search',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			const { term } = this.requestParams();

			check(term, Match.Maybe(String));

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const nameOrUsername = new RegExp(escapeRegExp(term), 'i');

			return API.v1.success(
				await findVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField({
					userId: this.userId,
					emailOrPhone: term,
					nameOrUsername,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);
