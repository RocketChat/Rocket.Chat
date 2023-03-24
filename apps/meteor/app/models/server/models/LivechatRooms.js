import { Base } from './_Base';
import Rooms from './Rooms';

class LivechatRooms extends Base {
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
		this.tryEnsureIndex({ pdfTranscriptRequested: 1 }, { sparse: true });
		this.tryEnsureIndex({ pdfTranscriptFileId: 1 }, { sparse: true }); // used on statistics
		this.tryEnsureIndex({ callStatus: 1 }, { sparse: true }); // used on statistics
		this.tryEnsureIndex({ priorityId: 1 }, { sparse: true });
		this.tryEnsureIndex({ slaId: 1 }, { sparse: true });
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
