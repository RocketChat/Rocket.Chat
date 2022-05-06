import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { deprecationWarning } from '../../../../api/server/helpers/deprecationWarning';
import {
	findVisitorInfo,
	findVisitedPages,
	findChatHistory,
	searchChats,
	findVisitorsToAutocomplete,
	findVisitorsByEmailOrPhoneOrNameOrUsername,
	findVisitorsToAutocompleteByName,
} from '../../../server/api/lib/visitors';

API.v1.addRoute(
	'livechat/visitors.info',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, {
				visitorId: String,
			});

			const visitor = await findVisitorInfo({ userId: this.userId, visitorId: this.queryParams.visitorId });

			return API.v1.success(visitor);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.pagesVisited/:roomId',
	{ authRequired: true },
	{
		async get() {
			check(this.urlParams, {
				roomId: String,
			});
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const pages = await findVisitedPages({
				userId: this.userId,
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
	{ authRequired: true },
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
	{ authRequired: true },
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
				closedChatsOnly: closedChatsOnly === 'true',
				servedChatsOnly: servedChatsOnly === 'true',
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

/* deprecated endpoint - "livechat/visitors.autocomplete", use "livechat/visitors.autocompleteByName" instead */
API.v1.addRoute(
	'livechat/visitors.autocomplete',
	{ authRequired: true },
	{
		async get() {
			const { selector } = this.queryParams;
			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			const response = await findVisitorsToAutocomplete({
				userId: this.userId,
				selector: JSON.parse(selector),
			});

			return API.v1.success(
				deprecationWarning({
					endpoint: 'livechat/visitors.autocomplete',
					response,
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.autocompleteByName',
	{ authRequired: true },
	{
		async get() {
			const { term } = this.requestParams();

			check(term, Match.Maybe(String));

			const result = await findVisitorsToAutocompleteByName({
				userId: this.userId,
				term,
			});

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.search',
	{ authRequired: true },
	{
		async get() {
			const { term } = this.requestParams();

			check(term, Match.Maybe(String));

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			return API.v1.success(
				await findVisitorsByEmailOrPhoneOrNameOrUsername({
					userId: this.userId,
					term,
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
