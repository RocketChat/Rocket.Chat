import { Base } from './_Base';

export class Analytics extends Base {
	constructor() {
		super('analytics');
		this.tryEnsureIndex({ date: 1 });
		this.tryEnsureIndex({ 'room._id': 1, date: 1 }, { unique: true });
	}
}

export default new Analytics();
