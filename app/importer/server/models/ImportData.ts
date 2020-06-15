import { Base } from '../../../models/server';

class ImportDataModel extends Base {
	constructor() {
		super('import_data');
	}
}

export const ImportData = new ImportDataModel();
