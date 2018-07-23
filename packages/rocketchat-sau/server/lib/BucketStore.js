export class BucketStorage {
//will store the arrays in buckets
	constructor() {
		this._limit = 100;
		this._queue = {};
		this._count = 0;
	}

	add(value) {
		const bucketId = this._getNextBucket();
		if (!bucketId) {
			return;
		}

		this._queue[bucketId].storage.push(value);
		this._queue[bucketId].count++;
		return bucketId;
	}

	remove(value, bucketId = null) {
		if (!bucketId) {
			bucketId = this._findBucketIdByValue(value);
		}

		if (!this._queue || typeof this._queue !== 'object') {
			return;
		}

		if (!bucketId || !this._queue[bucketId]) {
			return;
		}

		this._queue[bucketId].storage.splice(value, 1);
		this._queue[bucketId].count--;

		if (this._queue[bucketId].count === 0) {
			delete this._queue[bucketId];
			this._count--;
		}
	}

	clear() {
		this._queue = {};
	}

	count() {
		return this._count;
	}

	applyAll(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		const buckets = this._queue;
		Object.keys(buckets).forEach(b => {
			if (buckets[b].count && buckets[b].count > 0) {
				callback(buckets[b].storage);
			}
		});
	}

	_getNextBucket() {
		const limit = this._limit;
		const buckets = this._queue;
		let bucketId = Object.keys(buckets).find(key => buckets[key].count && buckets[key].count < limit);

		if (!bucketId) {
			bucketId = this._createBucket();
		}

		return bucketId;
	}

	_createBucket() {
		const date = new Date();
		const timestamp = date.getTime();

		if (!this._queue || typeof this._queue !== 'object') {
			return;
		}

		this._queue[timestamp] = { storage: [], count: 0 };
		this._count++;

		return timestamp;
	}

	_findBucketIdByValue(value) {
		if (!value) {
			return;
		}

		if (!this._queue || typeof this._queue !== 'object') {
			return;
		}

		const buckets = this._queue;
		return Object.keys(buckets).find(key => buckets[key].storage && buckets[key].storage.indexOf(value) > -1);
	}
}
