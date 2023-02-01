import { Base } from './Base';

export class Avatars extends Base {
	constructor() {
		super();
		this._initModel('avatars');
	}
}

export default new Avatars();
