import type { ICustomSound } from '@rocket.chat/core-typings';

import { Base } from './Base';

class CustomSounds extends Base<ICustomSound> {
	constructor() {
		super();
		this._initModel('custom_sounds');
	}
}

export default new CustomSounds();
