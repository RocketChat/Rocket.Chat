import { escapeRegExp } from '@rocket.chat/string-helpers';
import {
	isLivechatVisitorsInfoProps,
	isGETLivechatVisitorsPagesVisitedRoomIdParams,
	isGETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParams,
	isGETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParams,
	isGETLivechatVisitorsAutocompleteParams,
	isLivechatRidMessagesProps,
	isGETLivechatVisitorsSearch,
} from '@rocket.chat/rest-typings';
import { Messages } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import {
	findVisitorInfo,
	findVisitedPages,
	findChatHistory,
	searchChats,
	findVisitorsToAutocomplete,
	findVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField,
} from '../../../server/api/lib/visitors';
import { LivechatRooms } from '../../../../models/server';
import { normalizeMessagesForUser } from '../../../../utils/server/lib/normalizeMessagesForUser';
import { canAccessRoom } from '../../../../authorization/server';

API.v1.addRoute(
	'livechat/visitors.info',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLivechatVisitorsInfoProps },
	{
		async get() {
			const visitor = await findVisitorInfo({ visitorId: this.queryParams.visitorId });
			return API.v1.success(visitor);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.pagesVisited/:roomId',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatVisitorsPagesVisitedRoomIdParams },
	{
		async get() {
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
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		validateParams: isGETLivechatVisitorsChatHistoryRoomRoomIdVisitorVisitorIdParams,
	},
	{
		async get() {
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
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		validateParams: isGETLivechatVisitorsSearchChatsRoomRoomIdVisitorVisitorIdParams,
	},
	{
		async get() {
			const { roomId, visitorId } = this.urlParams;
			const { searchText, closedChatsOnly, servedChatsOnly, source } = this.queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const history = await searchChats({
				userId: this.userId,
				roomId,
				visitorId,
				searchText,
				closedChatsOnly,
				servedChatsOnly,
				source,
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
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatVisitorsAutocompleteParams },
	{
		async get() {
			const { selector } = this.queryParams;

			return API.v1.success(
				await findVisitorsToAutocomplete({
					selector: JSON.parse(selector),
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/visitors.search',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatVisitorsSearch },
	{
		async get() {
			const { term } = this.requestParams();

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const nameOrUsername = term ? new RegExp(escapeRegExp(term), 'i') : undefined;

			return API.v1.success(
				await findVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField({
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

API.v1.addRoute(
	'livechat/:rid/messages',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLivechatRidMessagesProps },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { searchTerm } = this.requestParams();

			const room = LivechatRooms.findOneById(this.urlParams.rid);

			if (!room) {
				throw new Error('invalid-room');
			}

			if (!canAccessRoom(room, this.user)) {
				throw new Error('not-allowed');
			}

			const { cursor, totalCount } = Messages.findLivechatClosedMessages(this.urlParams.rid, searchTerm, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
			});

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				offset,
				count,
				total,
			});
		},
	},
);
