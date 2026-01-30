// TODO: Remove this after meteor fixes the issue
// This override fixes a recent issue introduced after the update to Meteor 3.0
// MinimongoCollection.remove(query) where `query` has `_id: { $in: Array }` removes only the first found record.
LocalCollection.prototype['_eachPossiblyMatchingDocAsync'] = async function (selector, fn) {
	const specificIds = LocalCollection._idsMatchedBySelector(selector);

	if (specificIds) {
		for (const id of specificIds) {
			const doc = this._docs.get(id);

			if (doc && (await fn(doc, id)) === false) {
				// Changed from `!fn(doc,id)`
				break;
			}
		}
	} else {
		await this._docs.forEachAsync(fn);
	}
};

LocalCollection.prototype['_eachPossiblyMatchingDocSync'] = function (selector, fn) {
	const specificIds = LocalCollection._idsMatchedBySelector(selector);

	if (specificIds) {
		for (const id of specificIds) {
			const doc = this._docs.get(id);

			if (doc && fn(doc, id) === false) {
				// Changed from `!fn(doc,id)`
				break;
			}
		}
	} else {
		this._docs.forEach(fn);
	}
};
