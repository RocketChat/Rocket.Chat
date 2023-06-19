import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type AccountsCustomField = {
	type: 'text' | 'select';
	required: boolean;
	defaultValue: string;
	minLength: number;
	maxLength: number;
	options: string[];
	name: string;
};

export const useAccountsCustomFields = (): AccountsCustomField[] => {
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
