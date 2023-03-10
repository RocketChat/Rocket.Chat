import type { SelectOption } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';

type AccountsCustomField = {
	type: 'text' | 'select';
	required: boolean;
	defaultValue: string;
	minLength: number;
	maxLength: number;
	options: SelectOption[];
};

type AccountsCustomFields = {
	[key: string]: AccountsCustomField;
};

export const useAccountsCustomFields = () => {
	const [customFields, setCustomFields] = useState<AccountsCustomFields>();
	const accountsCustomFieldsJSON = useSetting('Accounts_CustomFields') as string;

	useEffect(() => {
		if (typeof accountsCustomFieldsJSON === 'string' && accountsCustomFieldsJSON.trim() !== '') {
			try {
				const parsedCustomFields = JSON.parse(accountsCustomFieldsJSON);
				return setCustomFields(parsedCustomFields);
			} catch {
				return console.error('Invalid JSON for Accounts_CustomFields');
			}
		} else {
			return setCustomFields(undefined);
		}
	}, [accountsCustomFieldsJSON]);

	return customFields;
};
