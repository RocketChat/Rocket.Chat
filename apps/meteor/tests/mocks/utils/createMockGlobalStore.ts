import { create } from 'zustand';

export function createMockGlobalStore(records: any[]) {
	return {
		use: create(() => records),
		get state() {
			return records;
		},
	};
}
