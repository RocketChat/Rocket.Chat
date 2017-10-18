import { Base } from './_Base';

export class OEmbed extends Base {
	constructor() {
		super();
		this._initModel('oembed');
	}
}

export default new OEmbed();
