import type { CustomFieldMetadata, ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

const fieldNameMap: { [key: string]: TranslationKey } = {
	name: 'Name',
	contactManager: 'Contact_Manager',
};

type MappedContactConflicts = Record<string, { name: string; label: string; values: string[] }>;

export function mapLivechatContactConflicts(
	contact: Serialized<ILivechatContact>,
	metadata: CustomFieldMetadata[] = [],
): MappedContactConflicts {
	if (!contact.conflictingFields?.length) {
		return {};
	}

	const conflicts = contact.conflictingFields.reduce((acc, current) => {
		const fieldName = current.field === 'manager' ? 'contactManager' : current.field.replace('customFields.', '');

		if (acc[fieldName]) {
			acc[fieldName].values.push(current.value);
		} else {
			acc[fieldName] = {
				name: fieldName,
				label:
					(current.field.startsWith('customFields.') && metadata.find(({ name }) => name === fieldName)?.label) || fieldNameMap[fieldName],
				values: [current.value],
			};
		}
		return acc;
	}, {} as MappedContactConflicts);

	// If there's a name conflict, add the current name to the conflict values as well
	if (conflicts.name?.values.length && contact.name) {
		conflicts.name.values.push(contact.name);
	}

	// If there's a manager conflict, add the current manager to the conflict values as well
	if (conflicts.contactManager?.values.length && contact.contactManager) {
		conflicts.contactManager.values.push(contact.contactManager);
	}

	return conflicts;
}
