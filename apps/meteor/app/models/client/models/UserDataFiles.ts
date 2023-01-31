import type { IUserDataFile } from '@rocket.chat/core-typings';

import { Base } from './Base';

export class UserDataFiles extends Base<IUserDataFile> {
	constructor() {
		super();
		this._initModel('userDataFiles');
	}
}

export default new UserDataFiles();
