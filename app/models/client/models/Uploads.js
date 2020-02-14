import { Base } from './_Base';

export class Uploads extends Base {
	constructor() {
		super();
		this._initModel('uploads');
	}
}

export default new Uploads();
