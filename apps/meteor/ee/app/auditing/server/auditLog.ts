import { Base } from '../../../../app/models/server';

class AudtitLog extends Base {
	constructor() {
		super('audit_log');
	}
}

export default new AudtitLog();
