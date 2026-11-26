export function createMockGlobalStore(records: any[]) {
	return {
		useStore: (selector: any) => selector(records),
		get state() {
			return records;
		},
	};
}
