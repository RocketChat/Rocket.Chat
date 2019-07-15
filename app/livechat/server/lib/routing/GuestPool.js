// import { settings } from '../../../settings';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';

import { Livechat } from '../Livechat';
import { RoutingManager } from '../RoutingManager';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';
import { sendNotification } from '../../../../lib';
import { Rooms } from '../../../../models';

/* Guest Pool Queuing Method:
	*
	* An incomming livechat is created as an Inquiry
	* which is picked up from an agent.
	* An Inquiry is visible to all agents (TODO: in the correct department)
	*
	* A room is still created with the initial message, but it is occupied by
	* only the client until paired with an agent
*/
class GuestPool {
	constructor() {
		this.config = {
			previewRoom: true,
			showConnecting: true,
			showQueue: true,
			returnQueue: true,
			enableTriggerAction: false,
		};
	}

	getNextAgent() {

	}

	delegateInquiry(inquiry) {
		const { department } = inquiry;
		const allAgents = Livechat.getAgents(department);
		if (allAgents.count() === 0) {
			throw new Meteor.Error('no-agent-available', 'Sorry, no available agents.');
		}

		const agentIds = allAgents.map((agent) => (department ? agent.agentId : agent._id));
		LivechatInquiry.openInquiryWithAgents(inquiry._id, agentIds);

		// Alert only the online agents of the queued request
		const onlineAgents = Livechat.getOnlineAgents(department);
		const { rid, v, message } = inquiry;

		onlineAgents.forEach((agent) => {
			const { _id, active, emails, language, status, statusConnection, username } = agent;
			const room = Rooms.findOneById(rid);

			sendNotification({
				// fake a subscription in order to make use of the function defined above
				subscription: {
					rid,
					t: 'l',
					u: {
						_id,
					},
					receiver: [{
						active,
						emails,
						language,
						status,
						statusConnection,
						username,
					}],
				},
				sender: v,
				hasMentionToAll: true, // consider all agents to be in the room
				hasMentionToHere: false,
				message: Object.assign({}, { u: v }),
				notificationMessage: message.msg,
				room: Object.assign(room, { name: TAPi18n.__('New_livechat_in_queue') }),
				mentionIds: [],
			});
		});

		return Rooms.findOneById(rid);
	}
}

RoutingManager.registerMethod('Guest_Pool', GuestPool);
