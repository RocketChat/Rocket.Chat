import type { InquiryWithAgentInfo, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { afterTakeInquiry } from '../../../../../app/livechat/server/lib/hooks';
import { settings } from '../../../../../app/settings/server';
import { AutoTransferChatScheduler } from '../lib/AutoTransferChatScheduler';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { OmnichannelQueueInactivityMonitor } from '../lib/QueueInactivityMonitor';
import { cbLogger } from '../lib/logger';

afterTakeInquiry.patch(
	async (
		originalFn,
		{ inquiry, room, agent }: { inquiry: InquiryWithAgentInfo; room: IOmnichannelRoom; agent: { agentId: string; username: string } },
	) => {
		await originalFn({ inquiry, room, agent });

		if (!inquiry) {
			return;
		}

		if (settings.get('Livechat_waiting_queue')) {
			const { department } = inquiry;
			void debouncedDispatchWaitingQueueStatus(department);
			cbLogger.debug({
				msg: 'Queue status updated',
				queue: department || 'public',
			});
		}

		if (settings.get<boolean>('Livechat_last_chatted_agent_routing') && agent && RoutingManager.getConfig()?.autoAssignAgent) {
			const { v: { token } = {} } = inquiry;
			if (token) {
				await LivechatVisitors.updateLastAgentByToken(token, { ...agent, ts: new Date() });
				cbLogger.info({
					msg: 'Updated last agent of visitor',
					token,
					newAgent: { _id: agent.agentId, username: agent.username },
				});
			}
		}

		const autoTransferTimeout = settings.get<number>('Livechat_auto_transfer_chat_timeout');
		if (autoTransferTimeout && !room?.autoTransferredAt && !room?.autoTransferOngoing) {
			await AutoTransferChatScheduler.scheduleRoom(inquiry.rid, autoTransferTimeout);
		}

		const maxQueueWaitTime = settings.get<number>('Livechat_max_queue_wait_time');
		if (maxQueueWaitTime > 0) {
			await OmnichannelQueueInactivityMonitor.stopInquiry(inquiry._id);
		}
	},
);
