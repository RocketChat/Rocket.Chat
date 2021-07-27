import { Base } from './_Base';

export class ServerEvents extends Base {
	constructor() {
		super('server_events');
		this.tryEnsureIndex({ t: 1, ip: 1, ts: -1 });
		this.tryEnsureIndex({ t: 1, 'u.username': 1, ts: -1 });
	}
}

export default new ServerEvents();
