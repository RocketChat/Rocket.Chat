import { authenticated } from '../../helpers/authenticated';

export const schema = `
	type Query {
		messages(
				channelId: String,
				channelDetails: ChannelNameAndDirect,
				channelName: String,
				cursor: String,
				count: Int,
				searchRegex: String,
				excludeServer: Boolean
		): MessagesWithCursor
	}
`;

export const resolver = {
	Query: {
		messages: authenticated((root, args) => {
			const messagesQuery = {};
			const messagesOptions = {
				sort: { ts: -1 }
			};
			const channelQuery = {};
			const isPagination = !!args.cursor || args.count > 0;
			let cursor;

			if (args.channelId) {
				// channelId
				channelQuery._id = args.channelId;
			} else if (args.channelDetails) {
				// channelDetails
				channelQuery.name = args.channelDetails.name;
				channelQuery.t = args.channelDetails.direct === true ? 'd' : { $ne: 'd' };
			} else {
				console.error('messages query must be called with channelId or channelDetails');
				return null;
			}

			const channel = RocketChat.models.Rooms.findOne(channelQuery);
			let messagesArray = [];

			if (channel) {

				// cursor
				if (isPagination && args.cursor) {
					const cursorMsg = RocketChat.models.Messages.findOne(args.cursor, { fields: { ts: 1 } });
					messagesQuery.ts = { $gt: cursorMsg.ts };
				}

				// searchRegex
				if (typeof args.searchRegex === 'string') {
					messagesQuery.msg = {
						$regex: new RegExp(args.searchRegex, 'i')
					};
				}

				// count
				if (isPagination && args.count) {
					messagesOptions.limit = args.count;
				}

				if (args.excludeServer === true) {
					messagesQuery.t = { $exists: false };
				}

				const messages = RocketChat.models.Messages.find(
					Object.assign({}, messagesQuery, { rid: channel._id }),
					messagesOptions
				);

				messagesArray = messages.fetch();

				if (isPagination) {
					cursor = (messagesArray[messagesArray.length - 1] || {})._id;
				}
			}

			return {
				cursor,
				channel,
				messagesArray
			};
		})
	}
};
