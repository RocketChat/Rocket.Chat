export function setUpdatedAt(record: Record<string, any>): void {
	if (/(^|,)\$/.test(Object.keys(record).join(','))) {
		record.$set = record.$set || {};
		record.$set._updatedAt = new Date();
	} else {
		record._updatedAt = new Date();
	}
}
