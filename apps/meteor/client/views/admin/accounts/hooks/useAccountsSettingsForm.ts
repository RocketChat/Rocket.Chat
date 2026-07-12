import type { ISetting } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useSettingsDispatch, useSetting } from '@rocket.chat/ui-contexts';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type AccountsSettingsFormValues = {
	Accounts_RegistrationForm: string;
	Accounts_ManuallyApproveNewUsers: boolean;
	Accounts_EmailVerification: boolean;
	Accounts_RequireNameForSignUp: boolean;
	Accounts_RequirePasswordConfirmation: boolean;
};

export const useAccountsSettingsForm = () => {
	const { t } = useTranslation();
	const dispatch = useSettingsDispatch();
	const dispatchToastMessage = useToastMessageDispatch();

	const values: AccountsSettingsFormValues = {
		Accounts_RegistrationForm: useSetting('Accounts_RegistrationForm', 'Public'),
		Accounts_ManuallyApproveNewUsers: useSetting('Accounts_ManuallyApproveNewUsers', false),
		Accounts_EmailVerification: useSetting('Accounts_EmailVerification', false),
		Accounts_RequireNameForSignUp: useSetting('Accounts_RequireNameForSignUp', true),
		Accounts_RequirePasswordConfirmation: useSetting('Accounts_RequirePasswordConfirmation', true),
	};

	// `values` keeps the form aligned with server settings, while `keepDirtyValues` preserves in-progress edits.
	const form = useForm<AccountsSettingsFormValues>({ values, resetOptions: { keepDirtyValues: true } });

	const {
		reset,
		handleSubmit,
		formState: { isDirty, dirtyFields },
	} = form;

	const save = handleSubmit(async (data) => {
		const changes = (Object.keys(dirtyFields) as (keyof AccountsSettingsFormValues)[]).map(
			(_id) => ({ _id, value: data[_id] }) as Partial<ISetting>,
		);

		if (changes.length === 0) {
			return;
		}

		try {
			await dispatch(changes, () => dispatchToastMessage({ type: 'success', message: t('Settings_updated') }));
			reset(data);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const cancel = () => reset(values);

	return { form, save, cancel, isDirty };
};
