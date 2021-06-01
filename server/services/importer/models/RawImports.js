import { Base } from '../../../models';

class RawImportsModel extends Base {
	constructor() {
		super('raw_imports');
	}
}

export const RawImports = new RawImportsModel();
