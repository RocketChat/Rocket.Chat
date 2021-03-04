import { Base } from './_Base';

export class Teams extends Base {
	constructor() {
		super('team');
		// this.tryEnsureIndex({ t: 1, ip: 1, ts: -1 });
		// this.tryEnsureIndex({ t: 1, 'u.username': 1, ts: -1 });
	}
}

export default new Teams();
