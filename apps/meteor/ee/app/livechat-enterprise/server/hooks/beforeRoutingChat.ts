import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { online } from '../../../../../app/livechat/server/api/lib/livechat';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { Livechat } from '../../../../../app/livechat/server/lib/LivechatTyped';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.beforeRouteChat',
	async (inquiry, agent) => {
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
				await Livechat.setDepartmentForGuest({
					token: inquiry?.v?.token,
					department: department.fallbackForwardDepartment,
				});
				// update inquiry

				const [dbInquiry] = await Promise.all([
					LivechatInquiry.setDepartmentByInquiryId(inquiry._id, department.fallbackForwardDepartment),
					LivechatRooms.setDepartmentByRoomId(inquiry.rid, department.fallbackForwardDepartment),
				]);
				inquiry = dbInquiry || inquiry;
			}
		}

		if (!settings.get('Livechat_waiting_queue')) {
			return inquiry;
		}

		if (!inquiry) {
			return inquiry;
		}

		const { _id, status } = inquiry;

		if (status !== 'ready') {
			return inquiry;
		}

		if (agent && (await allowAgentSkipQueue(agent))) {
			return inquiry;
		}

		return LivechatInquiry.findOneById(_id);
	},
	callbacks.priority.HIGH,
	'livechat-before-routing-chat',
);
