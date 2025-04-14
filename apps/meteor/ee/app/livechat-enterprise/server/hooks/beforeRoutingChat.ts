import { type ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { notifyOnLivechatInquiryChanged } from '../../../../../app/lib/server/lib/notifyListener';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { saveQueueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { setDepartmentForGuest } from '../../../../../app/livechat/server/lib/departmentsLib';
import { online } from '../../../../../app/livechat/server/lib/service-status';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
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
				await setDepartmentForGuest({
					token: inquiry?.v?.token,
					department: department.fallbackForwardDepartment,
				});

				// update inquiry
				const updatedLivechatInquiry = await LivechatInquiry.setDepartmentByInquiryId(inquiry._id, department.fallbackForwardDepartment);

				if (updatedLivechatInquiry) {
					void notifyOnLivechatInquiryChanged(updatedLivechatInquiry, 'updated', { department: updatedLivechatInquiry.department });
				}

				inquiry = updatedLivechatInquiry ?? inquiry;

				// update room
				await LivechatRooms.setDepartmentByRoomId(inquiry.rid, department.fallbackForwardDepartment);
			}
		}

		if (!settings.get('Livechat_waiting_queue')) {
			return inquiry;
		}

		if (agent && (await allowAgentSkipQueue(agent))) {
			return inquiry;
		}

		await saveQueueInquiry(inquiry);

		return LivechatInquiry.findOneById(inquiry._id);
	},
	callbacks.priority.HIGH,
	'livechat-before-routing-chat',
);
