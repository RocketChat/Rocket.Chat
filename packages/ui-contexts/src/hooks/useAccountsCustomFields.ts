import type { CustomFieldMetadata } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useSetting } from './useSetting';

export const useAccountsCustomFields = () => {
	const accountsCustomFieldsJSON = useSetting('Accounts_CustomFields');

	return useMemo((): CustomFieldMetadata[] => {
		if (typeof accountsCustomFieldsJSON !== 'string' || accountsCustomFieldsJSON.trim() === '') {
			return [];
		}
		try {
			return Object.entries<Omit<CustomFieldMetadata, 'name'>>(JSON.parse(accountsCustomFieldsJSON)).map(
				([fieldName, fieldData]): CustomFieldMetadata => {
					return { ...fieldData, name: fieldName };
				},
			);
		} catch {
			console.error('Invalid JSON for Accounts_CustomFields');
		}
		return [];
	}, [accountsCustomFieldsJSON]);
};
