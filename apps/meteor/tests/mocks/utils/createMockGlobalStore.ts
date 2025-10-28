export function createMockGlobalStore(records: any[]) {
	return {
		use: (selector: any) => selector(records),
		get state() {
			return records;
		},
	};
}
