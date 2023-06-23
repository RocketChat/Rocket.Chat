import { useMemo } from 'react';
import type { CustomFieldMetadata } from '@rocket.chat/core-typings';

import { useSetting } from './useSetting';

export const useAccountsCustomFields = (): CustomFieldMetadata[] => {
	const accountsCustomFieldsJSON = useSetting('Accounts_CustomFields');

	return useMemo(() => {
		if (typeof accountsCustomFieldsJSON !== 'string' || accountsCustomFieldsJSON.trim() === '') {
			return [];
		}
		try {
			return Object.entries(JSON.parse(accountsCustomFieldsJSON)).map(([fieldName, fieldData]) => {
				return { ...(fieldData as any), name: fieldName };
			});
		} catch {
			console.error('Invalid JSON for Accounts_CustomFields');
		}
		return [];
	}, [accountsCustomFieldsJSON]);
};
