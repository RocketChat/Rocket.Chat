import { Meteor } from 'meteor/meteor';
import { Base } from '/app/models';
import { Mongo } from 'meteor/mongo';

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
			this.tryEnsureIndex({ status: 1 }); // 'open', 'taken'
		}

		findOneById(inquiryId) {
			return this.findOne({ _id: inquiryId });
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
		* mark inquiry as open and set agents
		*/
		openInquiryWithAgents(inquiryId, agentIds) {
			return this.update({
				_id: inquiryId,
			}, {
				$set: {
					status: 'open',
					agents: agentIds,
				},
			});
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
				status: 'open',
			};

			const update = {
				$set: {
					'v.status': status,
				},
			};

			return this.update(query, update);
		}
	}

	LivechatInquiry = new LivechatInquiryClass();
}
