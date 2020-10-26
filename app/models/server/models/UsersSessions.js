import { Base } from './_Base';

export class UsersSessionsModel extends Base {
	constructor(name, options) {
		super(name, options);
		this.tryEnsureIndex({ 'connections.instanceId': 1 }, { sparse: 1, name: 'connections.instanceId' });
		this.tryEnsureIndex({ 'connections.id': 1 }, { sparse: 1, name: 'connections.id' });
	}
}

export default new UsersSessionsModel('usersSessions', { preventSetUpdatedAt: true });
