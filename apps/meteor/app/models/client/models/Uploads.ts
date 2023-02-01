import type { IUpload } from '@rocket.chat/core-typings';

import { Base } from './Base';

export class Uploads extends Base<IUpload> {
	constructor() {
		super();
		this._initModel('uploads');
	}
}

export default new Uploads();
