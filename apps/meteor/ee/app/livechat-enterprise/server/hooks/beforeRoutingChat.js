import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { LivechatInquiry } from '../../../../../app/models/server';
import { dispatchInquiryPosition } from '../lib/Helper';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';
import { LivechatDepartment, LivechatInquiry as LivechatInquiryRaw, LivechatRooms } from '../../../../../app/models/server/raw';
import { online } from '../../../../../app/livechat/server/api/lib/livechat';
import { saveQueueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.beforeRouteChat',
	async (inquiry, agent) => {
		// check here if department has fallback before queueing
		if (inquiry?.department && !online(inquiry.department, true, true)) {
			cbLogger.debug('No agents online on selected department. Inquiry will use fallback department');
			const department = await LivechatDepartment.findOneById(inquiry.department);
			if (department.fallbackForwardDepartment) {
				cbLogger.debug(
					`Inquiry ${inquiry._id} will be moved from department ${department._id} to fallback department ${department.fallbackForwardDepartment}`,
				);
				// update visitor
				Livechat.setDepartmentForGuest({
					token: inquiry?.v?.token,
					department: department.fallbackForwardDepartment,
				});
				// update inquiry
				inquiry = await LivechatInquiryRaw.setDepartmentByInquiryId(inquiry._id, department.fallbackForwardDepartment);
				// update room
				await LivechatRooms.setDepartmentByRoomId(inquiry.rid, department.fallbackForwardDepartment);
				cbLogger.debug(`Inquiry ${inquiry._id} moved. Continue normal queue process`);
			} else {
				cbLogger.debug('No fallback department configured. Skipping');
			}
		}

		if (!settings.get('Livechat_waiting_queue')) {
			cbLogger.debug('Skipping callback. Waiting queue disabled by setting');
			return inquiry;
		}

		if (!inquiry) {
			cbLogger.debug('Skipping callback. No inquiry provided');
			return inquiry;
		}

		const { _id, status, department } = inquiry;

		if (status !== 'ready') {
			cbLogger.debug(`Skipping callback. Inquiry ${_id} is not ready`);
			return inquiry;
		}

		if (agent && allowAgentSkipQueue(agent)) {
			cbLogger.debug(`Skipping callback. Agent ${agent.agentId} can skip queue`);
			return inquiry;
		}

		saveQueueInquiry(inquiry);

		if (settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')) {
			const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id, department });
			if (inq) {
				dispatchInquiryPosition(inq);
				cbLogger.debug(`Callback success. Inquiry ${_id} position has been notified`);
			}
		}

		return LivechatInquiry.findOneById(_id);
	},
	callbacks.priority.HIGH,
	'livechat-before-routing-chat',
);
