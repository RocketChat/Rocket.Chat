import type { ILivechatInquiryRecord, IRoom } from '@rocket.chat/core-typings';
import { create } from 'zustand';

export type LivechatInquiryLocalRecord = ILivechatInquiryRecord & { alert?: boolean };

export const useLivechatInquiryStore = create<{
	records: LivechatInquiryLocalRecord[];
	add: (record: LivechatInquiryLocalRecord) => void;
	merge: (record: LivechatInquiryLocalRecord) => void;
	discard: (id: ILivechatInquiryRecord['_id']) => void;
	discardForRoom: (rid: IRoom['_id']) => void;
	discardAll: () => void;
}>()((set) => ({
	records: [],

	add: (record) => {
		set(({ records }) => ({ records: [...records, record] }));
	},

	merge: (record) => {
		set(({ records }) => {
			const index = records.findIndex((r) => r._id === record._id);
			if (index === -1) {
				return { records: [...records, record] };
			}
			records[index] = record;
			return { records: [...records] };
		});
	},

	discard: (id) => {
		set(({ records }) => ({ records: records.filter((r) => r._id !== id) }));
	},

	discardForRoom: (rid) => {
		set(({ records }) => ({ records: records.filter((r) => r.rid !== rid) }));
	},

	discardAll: () => {
		set(() => ({ records: [] }));
	},
}));
