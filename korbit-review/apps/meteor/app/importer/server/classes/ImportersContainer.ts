import type { ImporterInfo } from '../definitions/ImporterInfo';

/** Container class which holds all of the importer details. */
export class ImportersContainer {
	private importers: Map<ImporterInfo['key'], ImporterInfo>;

	constructor() {
		this.importers = new Map();
	}

	add({ key, name, importer, visible }: Omit<ImporterInfo, 'visible'> & { visible?: boolean }) {
		this.importers.set(key, {
			key,
			name,
			visible: visible !== false,
			importer,
		});
	}

	get(key: string): ImporterInfo | undefined {
		return this.importers.get(key);
	}

	getAllVisible(): ImporterInfo[] {
		return Array.from(this.importers.values()).filter(({ visible }) => visible);
	}
}
