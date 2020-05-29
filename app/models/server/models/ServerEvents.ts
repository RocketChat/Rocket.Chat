import { Base } from './_Base';

export class ServerEvents extends Base {
	constructor() {
		super('server_events');
		this.tryEnsureIndex({ ip: 1, ts: 1 });
	}
}

export default new ServerEvents();
