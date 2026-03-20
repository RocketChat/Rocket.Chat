import { Random } from '@rocket.chat/random';

import type { ImportDataConverter } from '../../importer/server/classes/ImportDataConverter';

export async function addParsedContacts(this: ImportDataConverter, parsedContacts: string[][]): Promise<number> {
	const columnNames = parsedContacts.shift();
	let addedContacts = 0;

	for (const parsedData of parsedContacts) {
		const contactData = parsedData.reduce(
			(acc, value, index) => {
				const columnName = columnNames && index < columnNames.length ? columnNames[index] : `column${index}`;
				return {
					...acc,
					[columnName]: value,
				};
			},
			{} as Record<string, string>,
		);

		const { emails = '', phones = '', name = '', manager: contactManager = undefined, id = Random.id(), ...customFields } = contactData;
		const parsedEmails = emails
			.split(';')
			.map((value) => value.trim())
			.filter(Boolean);
		const parsedPhones = phones
			.split(';')
			.map((value) => value.trim())
			.filter(Boolean);
		const parsedName = name.trim();

		if (parsedEmails.length === 0 && parsedPhones.length === 0 && !parsedName) {
			continue;
		}

		await this.addContact({
			importIds: [id],
			emails: parsedEmails.length > 0 ? parsedEmails : undefined,
			phones: parsedPhones.length > 0 ? parsedPhones : undefined,
			name: parsedName,
			contactManager,
			customFields,
		});
		addedContacts++;
	}

	return addedContacts;
}
