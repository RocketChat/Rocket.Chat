import { Base } from '../../../../app/models/server';

class AuditLog extends Base {
	constructor() {
		super('audit_log');
	}
}

export default new AuditLog();
