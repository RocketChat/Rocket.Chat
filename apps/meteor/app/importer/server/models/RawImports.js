import { Base } from '../../../models/server';

class RawImportsModel extends Base {
	constructor() {
		super('raw_imports');
	}
}

export const RawImports = new RawImportsModel();
