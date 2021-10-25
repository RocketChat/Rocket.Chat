import { API } from '../../api';
import { Commands } from '../../../../../server/services/voip/connector/asterisk/Commands';
import { CommandHandler } from '../../../../../server/services/voip/connector/asterisk/CommandHandler';
import { IQueueDetails, IQueueSummary } from '../../../../../definition/ACDQueues';
import { IVoipConnectorResult } from '../../../../../definition/IVoipConnectorResult';

const commandHandler = new CommandHandler();
API.v1.addRoute('voip/queues.getSummary', { authRequired: true }, {
	get() {
		const queueSummary = Promise.await(commandHandler.executeCommand(
			Commands.queue_summary,
			this.requestParams())) as IVoipConnectorResult;
		this.logger.debug({ msg: 'API = voip/queues.getSummary ', result: queueSummary });
		return API.v1.success({ summary: queueSummary.result });
	},
});

API.v1.addRoute('voip/queues.getQueuedCallsForThisExtension', { authRequired: true }, {
	get() {
		const membershipDetails = {
			queueCount: 0,
			callWaitingCount: 0,
		};
		const queueSummary	= Promise.await(commandHandler.executeCommand(Commands.queue_summary)) as IVoipConnectorResult;
		for (const queue of queueSummary.result as IQueueSummary[]) {
			const queueDetails = Promise.await(commandHandler.executeCommand(
				Commands.queue_details,
				{ queueName: queue.name })) as IVoipConnectorResult;
			this.logger.debug({ msg: 'API = voip/queues.getCallWaitingInQueuesForThisExtension queue details = ', result: queueDetails });
			if ((queueDetails.result as unknown as IQueueDetails).members) {
				const isAMember = (queueDetails.result as unknown as IQueueDetails).members.some(
					(element) => element.name.endsWith(this.requestParams().extension),
				);
				if (isAMember) {
					membershipDetails.callWaitingCount += Number((queueDetails.result as unknown as IQueueDetails).calls);
					membershipDetails.queueCount++;
				}
			}
		}
		this.logger.debug({ msg: 'API = queues.getCallWaitingInQueuesForThisExtension', result: membershipDetails });
		return API.v1.success({ ...membershipDetails });
	},
});
