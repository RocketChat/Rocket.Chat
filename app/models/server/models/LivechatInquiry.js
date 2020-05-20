import { Base } from './_Base';

export class LivechatInquiry extends Base {
	constructor() {
		super('livechat_inquiry');

		this.tryEnsureIndex({ rid: 1 }); // room id corresponding to this inquiry
		this.tryEnsureIndex({ name: 1 }); // name of the inquiry (client name for now)
		this.tryEnsureIndex({ message: 1 }); // message sent by the client
		this.tryEnsureIndex({ ts: 1 }); // timestamp
		this.tryEnsureIndex({ department: 1 });
		this.tryEnsureIndex({ status: 1 }); // 'ready', 'queued', 'taken'
		this.tryEnsureIndex({ queueOrder: 1, estimatedWaitingTimeQueue: 1, estimatedServiceTimeAt: 1 });
	}

	findOneById(inquiryId) {
		return this.findOne({ _id: inquiryId });
	}

	findOneByRoomId(rid, options) {
		return this.findOne({ rid }, options);
	}

	getNextInquiryQueued(department) {
		return this.findOne(
			{
				status: 'queued',
				...department && { department },
			},
			{
				sort: {
					queueOrder: 1,
					estimatedWaitingTimeQueue: 1,
					estimatedServiceTimeAt: 1,
				},
			},
		);
	}

	/*
	* mark the inquiry as taken
	*/
	takeInquiry(inquiryId) {
		this.update({
			_id: inquiryId,
		}, {
			$set: { status: 'taken' },
			$unset: { defaultAgent: 1 },
		});
	}

	/*
	* mark inquiry as open
	*/
	openInquiry(inquiryId) {
		return this.update({
			_id: inquiryId,
		}, {
			$set: { status: 'open' },
		});
	}

	/*
	* mark inquiry as queued
	*/
	queueInquiry(inquiryId, defaultAgent) {
		return this.update({
			_id: inquiryId,
		}, {
			$set: {
				status: 'queued',
				...defaultAgent && { defaultAgent },
			},
		});
	}

	changeDepartmentIdByRoomId(rid, department) {
		const query = {
			rid,
		};
		const update = {
			$set: {
				department,
			},
		};

		this.update(query, update);
	}

	/*
	* return the status of the inquiry (open or taken)
	*/
	getStatus(inquiryId) {
		return this.findOne({ _id: inquiryId }).status;
	}

	updateVisitorStatus(token, status) {
		const query = {
			'v.token': token,
			status: 'queued',
		};

		const update = {
			$set: {
				'v.status': status,
			},
		};

		return this.update(query, update);
	}

	setNameByRoomId(rid, name) {
		const query = { rid };

		const update = {
			$set: {
				name,
			},
		};
		return this.update(query, update);
	}

	findOneByToken(token) {
		const query = {
			'v.token': token,
			status: 'queued',
		};
		return this.findOne(query);
	}

	async getCurrentSortedQueueAsync({ _id, department }) {
		const collectionObj = this.model.rawCollection();
		const aggregate = [
			{
				$match: {
					status: 'queued',
					...department && { department },
				},
			},
			{
				$sort: {
					ts: 1,
				},
			},
			{
				$group: {
					_id: 1,
					inquiry: {
						$push: {
							_id: '$_id',
							rid: '$rid',
							name: '$name',
							ts: '$ts',
							status: '$status',
							department: '$department',
						},
					},
				},
			},
			{
				$unwind: {
					path: '$inquiry',
					includeArrayIndex: 'position',
				},
			},
			{
				$project: {
					_id: '$inquiry._id',
					rid: '$inquiry.rid',
					name: '$inquiry.name',
					ts: '$inquiry.ts',
					status: '$inquiry.status',
					department: '$inquiry.department',
					position: 1,
				},
			},
		];

		// To get the current room position in the queue, we need to apply the next $match after the $project
		if (_id) {
			aggregate.push({ $match: { _id } });
		}

		return collectionObj.aggregate(aggregate).toArray();
	}

	removeDefaultAgentById(inquiryId) {
		return this.update({
			_id: inquiryId,
		}, {
			$unset: { defaultAgent: 1 },
		});
	}

	/*
	* remove the inquiry by roomId
	*/
	removeByRoomId(rid) {
		return this.remove({ rid });
	}

	removeByVisitorToken(token) {
		const query = {
			'v.token': token,
		};

		this.remove(query);
	}
}

export default new LivechatInquiry();
