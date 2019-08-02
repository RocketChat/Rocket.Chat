import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { Base } from '../../models';

export let LivechatInquiry;

if (Meteor.isClient) {
	LivechatInquiry = new Mongo.Collection('rocketchat_livechat_inquiry');
}

if (Meteor.isServer) {
	class LivechatInquiryClass extends Base {
		constructor() {
			super('livechat_inquiry');

			this.tryEnsureIndex({ rid: 1 }); // room id corresponding to this inquiry
			this.tryEnsureIndex({ name: 1 }); // name of the inquiry (client name for now)
			this.tryEnsureIndex({ message: 1 }); // message sent by the client
			this.tryEnsureIndex({ ts: 1 }); // timestamp
			this.tryEnsureIndex({ agents: 1 }); // Id's of the agents who can see the inquiry (handle departments)
			this.tryEnsureIndex({ status: 1 }); // 'ready', 'queued', 'taken'
		}

		findOneById(inquiryId) {
			return this.findOne({ _id: inquiryId });
		}

		findOneByRoomId(rid) {
			return this.findOne({ rid });
		}

		getNextInquiryQueued(department) {
			return this.findOne(
				{
					status: 'queued',
					...department && { department },
				},
				{
					sort: {
						ts: 1,
					},
				}
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
			});
		}

		/*
		* mark the inquiry as closed
		*/
		closeByRoomId(roomId, closeInfo) {
			return this.update({
				rid: roomId,
			}, {
				$set: {
					status: 'closed',
					closer: closeInfo.closer,
					closedBy: closeInfo.closedBy,
					closedAt: closeInfo.closedAt,
					'metrics.chatDuration': closeInfo.chatDuration,
				},
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
		queueInquiry(inquiryId) {
			return this.update({
				_id: inquiryId,
			}, {
				$set: { status: 'queued' },
			});
		}

		/*
		* mark inquiry as open and set agents
		*/
		queueInquiryWithAgents(inquiryId, agentIds) {
			return this.update({
				_id: inquiryId,
			}, {
				$set: {
					status: 'queued',
					agents: agentIds,
				},
			});
		}

		changeDepartmentIdByRoomId(inquiryId, department) {
			const query = {
				_id: inquiryId,
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

		async getCurrentSortedQueue({ _id, department }) {
			const collectionObj = this.model.rawCollection();
			const aggregate = [
				{
					$match: {
						status: 'queued',
						...department && { department },
					},
				},
				{ $sort: { ts: 1 } },
				{ $group: { _id: 1, inquiry: { $push: { _id: '$_id', rid: '$rid', name: '$name', ts: '$ts', status: '$status', department: '$department' } } } },
				{ $unwind: { path: '$inquiry', includeArrayIndex: 'position' } },
				{ $project: { _id: '$inquiry._id', rid: '$inquiry.rid', name: '$inquiry.name', ts: '$inquiry.ts', status: '$inquiry.status', department: '$inquiry.department', position: 1 } },
			];

			// To get the current room position in the queue, we need to apply the $match after the $project
			if (_id) {
				aggregate.push({ $match: { _id } });
			}

			return collectionObj.aggregate(aggregate).toArray();
		}
	}

	LivechatInquiry = new LivechatInquiryClass();
}
