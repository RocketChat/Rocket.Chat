export function setUpdatedAt(record: Record<string, any>): void {
	if (Array.isArray(record)) {
		// an aggregation pipeline update needs the timestamp as its own trailing stage; reuse a
		// trailing `_updatedAt` stage instead of pushing, so a reused pipeline array doesn't grow
		const lastStage = record[record.length - 1];
		if (lastStage?.$set?._updatedAt) {
			lastStage.$set._updatedAt = new Date();
			return;
		}

		record.push({ $set: { _updatedAt: new Date() } });
		return;
	}

	if (/(^|,)\$/.test(Object.keys(record).join(','))) {
		record.$set = record.$set || {};
		record.$set._updatedAt = new Date();
	} else {
		record._updatedAt = new Date();
	}
}
