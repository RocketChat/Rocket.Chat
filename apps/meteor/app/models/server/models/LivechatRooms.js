import s from 'underscore.string';
import _ from 'underscore';
import { Settings } from '@rocket.chat/models';

import { Base } from './_Base';
import Rooms from './Rooms';

export class LivechatRooms extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ open: 1 }, { sparse: true });
		this.tryEnsureIndex({ departmentId: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'metrics.chatDuration': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'metrics.serviceTimeDuration': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'metrics.visitorInactivity': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'omnichannel.predictedVisitorAbandonmentAt': 1 }, { sparse: true });
		this.tryEnsureIndex({ closedAt: 1 }, { sparse: true });
		this.tryEnsureIndex({ servedBy: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'v.token': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'v.token': 1, 'email.thread': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'v._id': 1 }, { sparse: true });
		this.tryEnsureIndex({ t: 1, departmentId: 1, closedAt: 1 }, { partialFilterExpression: { closedAt: { $exists: true } } });
		this.tryEnsureIndex({ source: 1 }, { sparse: true });
		this.tryEnsureIndex({ departmentAncestors: 1 }, { sparse: true });
		this.tryEnsureIndex(
			{ 't': 1, 'open': 1, 'source.type': 1, 'v.status': 1 },
			{
				partialFilterExpression: {
					't': { $eq: 'l' },
					'open': { $eq: true },
					'source.type': { $eq: 'widget' },
				},
			},
		);
		this.tryEnsureIndex({ 'livechatData.$**': 1 });
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			t: 'l',
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	updateSurveyFeedbackById(_id, surveyFeedback) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				surveyFeedback,
			},
		};

		return this.update(query, update);
	}

	updateDataByToken(token, key, value, overwrite = true) {
		const query = {
			'v.token': token,
			'open': true,
		};

		if (!overwrite) {
			const room = this.findOne(query, { fields: { livechatData: 1 } });
			if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
				return true;
			}
		}

		const update = {
			$set: {
				[`livechatData.${key}`]: value,
			},
		};

		return this.update(query, update);
	}

	saveRoomById({ _id, topic, tags, livechatData, ...extra }) {
		const setData = { ...extra };
		const unsetData = {};

		if (topic != null) {
			if (!_.isEmpty(s.trim(topic))) {
				setData.topic = s.trim(topic);
			} else {
				unsetData.topic = 1;
			}
		}

		if (Array.isArray(tags) && tags.length > 0) {
			setData.tags = tags;
		} else {
			unsetData.tags = 1;
		}

		if (livechatData) {
			Object.keys(livechatData).forEach((key) => {
				const value = s.trim(livechatData[key]);
				if (value) {
					setData[`livechatData.${key}`] = value;
				} else {
					unsetData[`livechatData.${key}`] = 1;
				}
			});
		}

		const update = {};

		if (!_.isEmpty(setData)) {
			update.$set = setData;
		}

		if (!_.isEmpty(unsetData)) {
			update.$unset = unsetData;
		}

		if (_.isEmpty(update)) {
			return;
		}

		return this.update({ _id }, update);
	}

	findById(_id, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			t: 'l',
			_id,
		};

		return this.find(query, options);
	}

	findByIds(ids, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			t: 'l',
			_id: { $in: ids },
		};

		return this.find(query, options);
	}

	findOneById(_id, fields = {}) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			t: 'l',
			_id,
		};

		return this.findOne(query, options);
	}

	findOneByIdAndVisitorToken(_id, visitorToken, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			't': 'l',
			_id,
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	findOneByVisitorTokenAndEmailThread(visitorToken, emailThread, options) {
		const query = {
			't': 'l',
			'v.token': visitorToken,
			'$or': [{ 'email.thread': { $elemMatch: { $in: emailThread } } }, { 'email.thread': new RegExp(emailThread.join('|')) }],
		};

		return this.findOne(query, options);
	}

	findOneByVisitorTokenAndEmailThreadAndDepartment(visitorToken, emailThread, departmentId, options) {
		const query = {
			't': 'l',
			'v.token': visitorToken,
			'$or': [{ 'email.thread': { $elemMatch: { $in: emailThread } } }, { 'email.thread': new RegExp(emailThread.join('|')) }],
			...(departmentId && { departmentId }),
		};

		return this.findOne(query, options);
	}

	findOneOpenByVisitorTokenAndEmailThread(visitorToken, emailThread, options) {
		const query = {
			't': 'l',
			'open': true,
			'v.token': visitorToken,
			'$or': [{ 'email.thread': { $elemMatch: { $in: emailThread } } }, { 'email.thread': new RegExp(emailThread.join('|')) }],
		};

		return this.findOne(query, options);
	}

	updateEmailThreadByRoomId(roomId, threadIds) {
		const query = {
			$addToSet: {
				'email.thread': threadIds,
			},
		};

		return this.update({ _id: roomId }, query);
	}

	findOneLastServedAndClosedByVisitorToken(visitorToken, options = {}) {
		const query = {
			't': 'l',
			'v.token': visitorToken,
			'closedAt': { $exists: true },
			'servedBy': { $exists: true },
		};

		options.sort = { closedAt: -1 };
		return this.findOne(query, options);
	}

	findOneByVisitorToken(visitorToken, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			't': 'l',
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	updateRoomCount = async function () {
		const query = {
			_id: 'Livechat_Room_Count',
		};

		const update = {
			$inc: {
				value: 1,
			},
		};

		const livechatCount = await Settings.findOneAndUpdate(query, update, { returnDocument: 'after' });
		return livechatCount.value;
	};

	findOpenByVisitorToken(visitorToken, options) {
		const query = {
			't': 'l',
			'open': true,
			'v.token': visitorToken,
		};

		return this.find(query, options);
	}

	findOneOpenByVisitorToken(visitorToken, options) {
		const query = {
			't': 'l',
			'open': true,
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	findOneOpenByVisitorTokenAndDepartmentIdAndSource(visitorToken, departmentId, source, options) {
		const query = {
			't': 'l',
			'open': true,
			'v.token': visitorToken,
			departmentId,
		};
		if (source) {
			query['source.type'] = source;
		}

		return this.findOne(query, options);
	}

	findOpenByVisitorTokenAndDepartmentId(visitorToken, departmentId, options) {
		const query = {
			't': 'l',
			'open': true,
			'v.token': visitorToken,
			departmentId,
		};

		return this.find(query, options);
	}

	findByVisitorToken(visitorToken) {
		const query = {
			't': 'l',
			'v.token': visitorToken,
		};

		return this.find(query);
	}

	findByVisitorIdAndAgentId(visitorId, agentId, options) {
		const query = {
			t: 'l',
			...(visitorId && { 'v._id': visitorId }),
			...(agentId && { 'servedBy._id': agentId }),
		};

		return this.find(query, options);
	}

	findOneOpenByRoomIdAndVisitorToken(roomId, visitorToken, options) {
		const query = {
			't': 'l',
			'_id': roomId,
			'open': true,
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	findClosedRooms(departmentIds, options) {
		const query = {
			t: 'l',
			open: { $exists: false },
			closedAt: { $exists: true },
			...(Array.isArray(departmentIds) && departmentIds.length > 0 && { departmentId: { $in: departmentIds } }),
		};

		return this.find(query, options);
	}

	setResponseByRoomId(roomId, response) {
		return this.update(
			{
				_id: roomId,
				t: 'l',
			},
			{
				$set: {
					responseBy: {
						_id: response.user._id,
						username: response.user.username,
						lastMessageTs: new Date(),
					},
				},
				$unset: {
					waitingResponse: 1,
				},
			},
		);
	}

	setNotResponseByRoomId(roomId) {
		return this.update(
			{
				_id: roomId,
				t: 'l',
			},
			{
				$set: {
					waitingResponse: true,
				},
				$unset: {
					responseBy: 1,
				},
			},
		);
	}

	setAgentLastMessageTs(roomId) {
		return this.update(
			{
				_id: roomId,
				t: 'l',
			},
			{
				$set: {
					'responseBy.lastMessageTs': new Date(),
				},
			},
		);
	}

	saveAnalyticsDataByRoomId(room, message, analyticsData) {
		const update = {
			$set: {},
		};

		if (analyticsData) {
			update.$set['metrics.response.avg'] = analyticsData.avgResponseTime;

			update.$inc = {};
			update.$inc['metrics.response.total'] = 1;
			update.$inc['metrics.response.tt'] = analyticsData.responseTime;
			update.$inc['metrics.reaction.tt'] = analyticsData.reactionTime;
		}

		if (analyticsData && analyticsData.firstResponseTime) {
			update.$set['metrics.response.fd'] = analyticsData.firstResponseDate;
			update.$set['metrics.response.ft'] = analyticsData.firstResponseTime;
			update.$set['metrics.reaction.fd'] = analyticsData.firstReactionDate;
			update.$set['metrics.reaction.ft'] = analyticsData.firstReactionTime;
		}

		// livechat analytics : update last message timestamps
		const visitorLastQuery = room.metrics && room.metrics.v ? room.metrics.v.lq : room.ts;
		const agentLastReply = room.metrics && room.metrics.servedBy ? room.metrics.servedBy.lr : room.ts;

		if (message.token) {
			// update visitor timestamp, only if its new inquiry and not continuing message
			if (agentLastReply >= visitorLastQuery) {
				// if first query, not continuing query from visitor
				update.$set['metrics.v.lq'] = message.ts;
			}
		} else if (visitorLastQuery > agentLastReply) {
			// update agent timestamp, if first response, not continuing
			update.$set['metrics.servedBy.lr'] = message.ts;
		}

		return this.update(
			{
				_id: room._id,
				t: 'l',
			},
			update,
		);
	}

	getTotalConversationsBetweenDate(t, date, { departmentId } = {}) {
		const query = {
			t,
			ts: {
				$gte: new Date(date.gte), // ISO Date, ts >= date.gte
				$lt: new Date(date.lt), // ISODate, ts < date.lt
			},
			...(departmentId && departmentId !== 'undefined' && { departmentId }),
		};

		return this.find(query).count();
	}

	getAnalyticsMetricsBetweenDate(t, date, { departmentId } = {}) {
		const query = {
			t,
			ts: {
				$gte: new Date(date.gte), // ISO Date, ts >= date.gte
				$lt: new Date(date.lt), // ISODate, ts < date.lt
			},
			...(departmentId && departmentId !== 'undefined' && { departmentId }),
		};

		return this.find(query, {
			fields: { ts: 1, departmentId: 1, open: 1, servedBy: 1, metrics: 1, msgs: 1 },
		});
	}

	getAnalyticsMetricsBetweenDateWithMessages(t, date, { departmentId } = {}, extraQuery) {
		return this.model.rawCollection().aggregate([
			{
				$match: {
					t,
					ts: {
						$gte: new Date(date.gte), // ISO Date, ts >= date.gte
						$lt: new Date(date.lt), // ISODate, ts < date.lt
					},
					...(departmentId && departmentId !== 'undefined' && { departmentId }),
				},
			},
			{ $addFields: { roomId: '$_id' } },
			{
				$lookup: {
					from: 'rocketchat_message',
					// mongo doesn't like _id as variable name here :(
					let: { roomId: '$roomId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$$roomId', '$rid'],
										},
										{
											// this is similar to do { $exists: false }
											$lte: ['$t', null],
										},
										...(extraQuery ? [extraQuery] : []),
									],
								},
							},
						},
					],
					as: 'messages',
				},
			},
			{
				$unwind: {
					path: '$messages',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: {
						_id: '$_id',
						ts: '$ts',
						departmentId: '$departmentId',
						open: '$open',
						servedBy: '$servedBy',
						metrics: '$metrics',
					},
					messagesCount: {
						$sum: 1,
					},
				},
			},
			{
				$project: {
					_id: '$_id._id',
					ts: '$_id.ts',
					departmentId: '$_id.departmentId',
					open: '$_id.open',
					servedBy: '$_id.servedBy',
					metrics: '$_id.metrics',
					msgs: '$messagesCount',
				},
			},
		]);
	}

	getAnalyticsBetweenDate(date, { departmentId } = {}) {
		return this.model.rawCollection().aggregate([
			{
				$match: {
					t: 'l',
					ts: {
						$gte: new Date(date.gte), // ISO Date, ts >= date.gte
						$lt: new Date(date.lt), // ISODate, ts < date.lt
					},
					...(departmentId && departmentId !== 'undefined' && { departmentId }),
				},
			},
			{ $addFields: { roomId: '$_id' } },
			{
				$lookup: {
					from: 'rocketchat_message',
					// mongo doesn't like _id as variable name here :(
					let: { roomId: '$roomId' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{
											$eq: ['$$roomId', '$rid'],
										},
										{
											// this is similar to do { $exists: false }
											$lte: ['$t', null],
										},
									],
								},
							},
						},
					],
					as: 'messages',
				},
			},
			{
				$unwind: {
					path: '$messages',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: {
						_id: '$_id',
						ts: '$ts',
						departmentId: '$departmentId',
						open: '$open',
						servedBy: '$servedBy',
						metrics: '$metrics',
						onHold: '$onHold',
					},
					messagesCount: {
						$sum: 1,
					},
				},
			},
			{
				$project: {
					_id: '$_id._id',
					ts: '$_id.ts',
					departmentId: '$_id.departmentId',
					open: '$_id.open',
					servedBy: '$_id.servedBy',
					metrics: '$_id.metrics',
					msgs: '$messagesCount',
					onHold: '$_id.onHold',
				},
			},
		]);
	}

	closeByRoomId(roomId, closeInfo) {
		const { closer, closedBy, closedAt, chatDuration, serviceTimeDuration, ...extraData } = closeInfo;

		return this.update(
			{
				_id: roomId,
				t: 'l',
			},
			{
				$set: {
					closer,
					closedBy,
					closedAt,
					'metrics.chatDuration': chatDuration,
					'metrics.serviceTimeDuration': serviceTimeDuration,
					'v.status': 'offline',
					...extraData,
				},
				$unset: {
					open: 1,
				},
			},
		);
	}

	requestTranscriptByRoomId(roomId, transcriptInfo = {}) {
		const { requestedAt, requestedBy, email, subject } = transcriptInfo;

		return this.update(
			{
				_id: roomId,
				t: 'l',
			},
			{
				$set: {
					transcriptRequest: {
						requestedAt,
						requestedBy,
						email,
						subject,
					},
				},
			},
		);
	}

	removeTranscriptRequestByRoomId(roomId) {
		return this.update(
			{
				_id: roomId,
				t: 'l',
			},
			{
				$unset: {
					transcriptRequest: 1,
				},
			},
		);
	}

	findOpenByAgent(userId) {
		const query = {
			't': 'l',
			'open': true,
			'servedBy._id': userId,
		};

		return this.find(query);
	}

	changeAgentByRoomId(roomId, newAgent) {
		const query = {
			_id: roomId,
			t: 'l',
		};
		const update = {
			$set: {
				servedBy: {
					_id: newAgent.agentId,
					username: newAgent.username,
					ts: new Date(),
				},
			},
		};

		if (newAgent.ts) {
			update.$set.servedBy.ts = newAgent.ts;
		}

		this.update(query, update);
	}

	changeDepartmentIdByRoomId(roomId, departmentId) {
		const query = {
			_id: roomId,
			t: 'l',
		};
		const update = {
			$set: {
				departmentId,
			},
		};

		this.update(query, update);
	}

	saveCRMDataByRoomId(roomId, crmData) {
		const query = {
			_id: roomId,
			t: 'l',
		};
		const update = {
			$set: {
				crmData,
			},
		};

		return this.update(query, update);
	}

	updateVisitorStatus(token, status) {
		const query = {
			'v.token': token,
			'open': true,
			't': 'l',
		};

		const update = {
			$set: {
				'v.status': status,
			},
		};

		return this.update(query, update);
	}

	removeAgentByRoomId(roomId) {
		const query = {
			_id: roomId,
			t: 'l',
		};
		const update = {
			$set: { queuedAt: new Date() },
			$unset: { servedBy: 1 },
		};

		this.update(query, update);
	}

	removeByVisitorToken(token) {
		const query = {
			't': 'l',
			'v.token': token,
		};

		this.remove(query);
	}

	removeById(_id) {
		const query = {
			_id,
			t: 'l',
		};

		return this.remove(query);
	}

	setVisitorLastMessageTimestampByRoomId(roomId, lastMessageTs) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				'v.lastMessageTs': lastMessageTs,
			},
		};

		return this.update(query, update);
	}

	setVisitorInactivityInSecondsById(roomId, visitorInactivity) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				'metrics.visitorInactivity': visitorInactivity,
			},
		};

		return this.update(query, update);
	}

	setAutoTransferredAtById(roomId) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				autoTransferredAt: new Date(),
			},
		};

		return this.update(query, update);
	}

	setAutoTransferOngoingById(roomId) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				autoTransferOngoing: true,
			},
		};

		return this.update(query, update);
	}

	unsetAutoTransferOngoingById(roomId) {
		const query = {
			_id: roomId,
		};
		const update = {
			$unset: {
				autoTransferOngoing: 1,
			},
		};

		return this.update(query, update);
	}

	changeVisitorByRoomId(roomId, { _id, username, token }) {
		const query = {
			_id: roomId,
			t: 'l',
		};
		const update = {
			$set: {
				'v._id': _id,
				'v.username': username,
				'v.token': token,
			},
		};

		return this.update(query, update);
	}

	unarchiveOneById(roomId) {
		const query = {
			_id: roomId,
			t: 'l',
		};
		const update = {
			$set: {
				open: true,
			},
			$unset: {
				servedBy: 1,
				closedAt: 1,
				closedBy: 1,
				closer: 1,
			},
		};

		return this.update(query, update);
	}
}

export default new LivechatRooms(Rooms.model, true);
