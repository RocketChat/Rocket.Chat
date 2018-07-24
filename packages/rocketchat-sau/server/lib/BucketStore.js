export class BucketStorage {
//will store the arrays in buckets
	constructor() {
		this._limit = 100;
		this._container = {};
		this._count = 0;
	}

	add(value) {
		const bucketId = !this._findBucketIdByValue(value) && this._getNextBucket();
		if (!bucketId) {
			return;
		}

		this._container[bucketId].storage.push(value);
		this._container[bucketId].count++;
		return bucketId;
	}

	remove(value, bucketId = null) {
		if (!this._isValidQueue()) {
			return false;
		}

		if (!bucketId) {
			bucketId = this._findBucketIdByValue(value);
		}

		if (!bucketId || !this._container[bucketId]) {
			return false;
		}

		const arrayIndex = this._container[bucketId].storage.indexOf(value);
		if (arrayIndex === -1) {
			return false;
		}

		this._container[bucketId].storage.splice(arrayIndex, 1);
		this._container[bucketId].count--;

		if (this._container[bucketId].count === 0) {
			delete this._container[bucketId];
			this._count--;
		}

		return true;
	}

	clear() {
		this._container = {};
	}

	count() {
		return this._count;
	}

	applyAll(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		const buckets = this._container;
		Object.keys(buckets).forEach(b => {
			if (buckets[b].count && buckets[b].count > 0) {
				callback(buckets[b].storage);
			}
		});
	}

	_isValidQueue() {
		return this._container && typeof this._container === 'object';
	}

	_getNextBucket() {
		const limit = this._limit;
		const buckets = this._container;
		let bucketId = Object.keys(buckets).find(key => buckets[key].count && buckets[key].count < limit);

		if (!bucketId) {
			bucketId = this._createBucket();
		}

		return bucketId;
	}

	_createBucket() {
		const date = new Date();
		const timestamp = date.getTime();

		if (!this._isValidQueue()) {
			return;
		}

		this._container[timestamp] = { storage: [], count: 0 };
		this._count++;

		return timestamp;
	}

	_findBucketIdByValue(value) {
		if (!value) {
			return false;
		}

		if (!this._isValidQueue()) {
			return false;
		}

		const buckets = this._container;
		return Object.keys(buckets).find(key => buckets[key].storage && buckets[key].storage.indexOf(value) > -1);
	}
}
