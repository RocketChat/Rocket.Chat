import type { Base } from '../server';

export class ImporterInfo {
	key: string;

	name: string;

	mimeType: string;

	warnings: { href: string; text: string }[];

	importer: Base | undefined;

	instance: undefined;

	/**
	 * Creates a new class which contains information about the importer.
	 *
	 * @param {string} key The unique key of this importer.
	 * @param {string} name The i18n name.
	 * @param {string} mimeType The type of file it expects.
	 * @param {{ href: string, text: string }[]} warnings An array of warning objects. `{ href, text }`
	 */
	constructor(key: string, name = '', mimeType = '', warnings = []) {
		this.key = key;
		this.name = name;
		this.mimeType = mimeType;
		this.warnings = warnings;

		this.importer = undefined;
		this.instance = undefined;
	}
}
