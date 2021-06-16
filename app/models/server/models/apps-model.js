import { Base } from './_Base';

export class AppsModel extends Base {
	constructor() {
		super('apps');

		this.raw = this.model.rawCollection();
	}
}
