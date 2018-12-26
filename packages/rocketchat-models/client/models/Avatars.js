import { Base } from './_Base';

export class Avatars extends Base {
	constructor() {
		super();
		this._initModel('avatars');
	}
}

export default new Avatars();
