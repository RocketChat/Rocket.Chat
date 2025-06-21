import type { ILivechatInquiryRecord, SelectedAgent, ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { notifyOnLivechatInquiryChanged } from '../../../../../app/lib/server/lib/notifyListener';
import { allowAgentSkipQueue } from '../../../../../app/livechat/server/lib/Helper';
import { saveQueueInquiry } from '../../../../../app/livechat/server/lib/QueueManager';
import { setDepartmentForGuest } from '../../../../../app/livechat/server/lib/departmentsLib';
import { beforeRouteChat } from '../../../../../app/livechat/server/lib/hooks';
import { online } from '../../../../../app/livechat/server/lib/service-status';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';

beforeRouteChat.patch(
	async (
		originalFn: (inquiry: ILivechatInquiryRecord, _agent?: SelectedAgent | null) => Promise<ILivechatInquiryRecord | null | undefined>,
		inquiry: ILivechatInquiryRecord,
		agent?: SelectedAgent | null,
	) => {
		await originalFn(inquiry, agent);

		if (!inquiry) {
			return inquiry;
		}

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
				cbLogger.info({
					msg: 'Moving inquiry to fallback department',
					originalDepartment: inquiry.department,
					fallbackDepartment: department.fallbackForwardDepartment,
					inquiryId: inquiry._id,
				});

				const [, updatedLivechatInquiry] = await Promise.all([
					setDepartmentForGuest({
						visitorId: inquiry.v._id,
						department: department.fallbackForwardDepartment,
					}),
					LivechatInquiry.setDepartmentByInquiryId(inquiry._id, department.fallbackForwardDepartment),
					LivechatRooms.setDepartmentByRoomId(inquiry.rid, department.fallbackForwardDepartment),
				]);

				if (updatedLivechatInquiry) {
					void notifyOnLivechatInquiryChanged(updatedLivechatInquiry, 'updated', { department: updatedLivechatInquiry.department });
				}

				inquiry = updatedLivechatInquiry ?? inquiry;
			}
		}

		if (!settings.get('Livechat_waiting_queue')) {
			return inquiry;
		}

		if (agent && (await allowAgentSkipQueue(agent))) {
			return inquiry;
		}

		return saveQueueInquiry(inquiry);
	},
);
