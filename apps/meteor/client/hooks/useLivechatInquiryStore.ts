import type { ILivechatInquiryRecord, IRoom } from '@rocket.chat/core-typings';
import { create } from 'zustand';

export const useLivechatInquiryStore = create<{
	records: (ILivechatInquiryRecord & { alert?: boolean })[];
	add: (record: ILivechatInquiryRecord & { alert?: boolean }) => void;
	merge: (record: ILivechatInquiryRecord & { alert?: boolean }) => void;
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
