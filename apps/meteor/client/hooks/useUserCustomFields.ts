import { useSetting } from '@rocket.chat/ui-contexts';

type CustomField =
	| {
			[key: string]: string;
	  }
	| undefined;

type CustomFieldDisplay =
	| {
			label: string;
			value?: string;
	  }
	| undefined;

export const useUserCustomFields = (customFields: CustomField): CustomFieldDisplay[] | undefined => {
	const customFieldsToShowSetting = useSetting('Accounts_CustomFieldsToShowInUserInfo');

	let customFieldsToShowObj: CustomField[] | undefined;
	try {
		customFieldsToShowObj = JSON.parse(customFieldsToShowSetting as string);
	} catch (error) {
		customFieldsToShowObj = undefined;
	}

	if (!customFieldsToShowObj) {
		return undefined;
	}

	const customFieldsToShow = customFieldsToShowObj.map((value) => {
		if (!value) {
			return undefined;
		}

		const [customFieldLabel] = Object.keys(value);
		const [customFieldValue] = Object.values(value);
		const fieldValue = customFields?.[customFieldValue];
		return { label: customFieldLabel, value: fieldValue !== '' ? fieldValue : undefined };
	});

	return customFieldsToShow;
};
