import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { api, request } from '../api-data';

export const fetchAllInquiries = async (
	credentials: { 'X-Auth-Token': string; 'X-User-Id': string },
	department?: string,
): Promise<ILivechatInquiryRecord[]> => {
	const inquiries: ILivechatInquiryRecord[] = [];

	let hasMore = true;
	let offset = 0;

	while (hasMore) {
		const { body } = (await request
			.get(api('livechat/inquiries.queuedForUser'))
			.set(credentials)
			.query({
				...(department && { department }),
				offset,
			})
			.success()) as { body: PaginatedResult<{ inquiries: Array<ILivechatInquiryRecord> }> };

		inquiries.push(...body.inquiries);

		hasMore = body.total > inquiries.length;
		offset += body.count;
	}

	return inquiries;
};
