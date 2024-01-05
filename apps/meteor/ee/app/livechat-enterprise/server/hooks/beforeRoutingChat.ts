import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { online } from '../../../../../app/livechat/server/api/lib/livechat';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { Livechat } from '../../../../../app/livechat/server/lib/LivechatTyped';
import { saveQueueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { getInquirySortMechanismSetting } from '../../../../../app/livechat/server/lib/settings';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { dispatchInquiryPosition } from '../lib/Helper';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.beforeRouteChat',
	async (inquiry, agent) => {
		if (!inquiry) {
			return inquiry;
		}
		// check here if department has fallback before queueing
		if (inquiry?.department && !(await online(inquiry.department, true, true))) {
			const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'fallbackForwardDepartment'>>(
				inquiry.department,
				{
					projection: { fallbackForwardDepartment: 1 },
				},
			);

			if (!department) {
				return inquiry;
			}
			if (department.fallbackForwardDepartment) {
				cbLogger.info(
					`Inquiry ${inquiry._id} will be moved from department ${department._id} to fallback department ${department.fallbackForwardDepartment}`,
				);
				// update visitor

				const [inq] = await Promise.all([
					LivechatInquiry.setDepartmentByInquiryId(inquiry._id, department.fallbackForwardDepartment),
					Livechat.setDepartmentForGuest({
						token: inquiry?.v?.token,
						department: department.fallbackForwardDepartment,
					}),
					LivechatRooms.setDepartmentByRoomId(inquiry.rid, department.fallbackForwardDepartment),
				]);
				inquiry = inq ?? inquiry;
			}
		}

		if (!settings.get('Livechat_waiting_queue')) {
			return inquiry;
		}

		const { _id, status, department } = inquiry;

		if (status !== 'ready') {
			return inquiry;
		}

		if (agent && (await allowAgentSkipQueue(agent))) {
			return inquiry;
		}

		await saveQueueInquiry(inquiry);

		if (settings.get('Omnichannel_calculate_dispatch_service_queue_statistics')) {
			const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({
				inquiryId: _id,
				department,
				queueSortBy: getInquirySortMechanismSetting(),
			});
			if (inq) {
				void dispatchInquiryPosition(inq);
			}
		}

		return LivechatInquiry.findOneById(_id);
	},
	callbacks.priority.HIGH,
	'livechat-before-routing-chat',
);
