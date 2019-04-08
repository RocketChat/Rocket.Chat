import { Base as _Base } from 'meteor/rocketchat:models';

class RawImportsModel extends _Base {
	constructor() {
		super('raw_imports');
	}
}

export const RawImports = new RawImportsModel();
