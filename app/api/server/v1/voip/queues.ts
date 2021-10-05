import { API } from '../../api';
import { Commands } from '../../../../../server/services/voip/connector/asterisk/Commands';
import { CommandHandler } from '../../../../../server/services/voip/connector/asterisk/CommandHandler';
import { IQueueDetails, IQueueSummary, IQueueMember } from '../../../../../definition/ACDQueues';

function isAMember(members: IQueueMember[], extension: any): boolean {
	for (let i = 0; i < members.length; i++) {
		if (members[i].name.endsWith(extension)) {
			return true;
		}
	}
	return false;
}

const commandHandler = new CommandHandler();
API.v1.addRoute('queues.getSummary', { authRequired: true }, {
	get() {
		try {
			const queueSummary = Promise.await (commandHandler.executeCommand(
				Commands.queue_summary,
				this.requestParams())) as IQueueSummary [];
			this.logger.debug({ msg: 'API = queues.getSummary ',
				result: queueSummary });
			return API.v1.success({ summary: queueSummary });
		} catch (error) {
			return API.v1.failure({
				error,
			});
		}
	},
});

API.v1.addRoute('queues.getCallWaitingInQueuesForThisExtension', { authRequired: true }, {
	get() {
		const membershipDetails = {
			queueCount: 0,
			callWaitingCount: 0,
		};
		const queueSummary = Promise.await (commandHandler.executeCommand(Commands.queue_summary)) as IQueueSummary [];
		for (let i = 0; i < queueSummary.length; i++) {
			const queueDetails = Promise.await (commandHandler.executeCommand(
				Commands.queue_details,
				{ queueName: queueSummary[i].name })) as IQueueDetails;
			this.logger.debug({ msg: 'API = queues.getCallWaitingInQueuesForThisExtension queue details = ',
				result: queueDetails });
			if (queueDetails.members) {
				const member = isAMember(queueDetails.members, this.requestParams().extension);
				if (member) {
					membershipDetails.callWaitingCount += Number(queueDetails.calls);
					membershipDetails.queueCount++;
				}
			}
		}
		this.logger.debug({ msg: 'API = queues.getCallWaitingInQueuesForThisExtension',
			result: membershipDetails });
		return API.v1.success({ ...membershipDetails });
	},
});
