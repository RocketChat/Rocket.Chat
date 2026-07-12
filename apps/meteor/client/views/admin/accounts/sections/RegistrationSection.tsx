import { Box, Select, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import SettingsCard from '../components/SettingsCard';
import SettingsCardItem from '../components/SettingsCardItem';
import SettingsGroupLabel from '../components/SettingsGroupLabel';
import type { AccountsSettingsFormValues } from '../hooks/useAccountsSettingsForm';

const RegistrationSection = () => {
	const { t } = useTranslation();
	const { control } = useFormContext<AccountsSettingsFormValues>();

	const siteUrl = useSetting('Site_Url', '');
	const secret = useSetting('Accounts_RegistrationForm_SecretURL', '');
	const secretRegistrationLink = `${siteUrl.replace(/\/$/, '')}/register/${secret}`;

	const registerOptions: [string, string][] = [
		['Public', t('Accounts_Registration_Public_Option')],
		['Disabled', t('Accounts_Registration_Disabled_Option')],
		['Secret URL', t('Accounts_Registration_SecretURL_Option')],
	];

	const registerFieldId = useId();
	const secretLinkFieldId = useId();

	return (
		<Box mbe={32}>
			<Box fontScale='h3' color='default'>
				{t('Accounts_Registration_Title')}
			</Box>
			<Box fontScale='p2' color='hint' mbe={20}>
				{t('Accounts_Registration_Description')}
			</Box>

			<SettingsGroupLabel>{t('Accounts_Registration_WhoCanJoin')}</SettingsGroupLabel>
			<SettingsCard>
				<SettingsCardItem
					title={<label htmlFor={registerFieldId}>{t('Accounts_Registration_WhoCanRegister')}</label>}
					description={t('Accounts_Registration_WhoCanRegister_Description')}
				>
					<Controller
						name='Accounts_RegistrationForm'
						control={control}
						render={({ field: { value, onChange } }) => (
							<Select id={registerFieldId} value={value} onChange={(next) => onChange(String(next))} options={registerOptions} />
						)}
					/>
				</SettingsCardItem>
				<SettingsCardItem
					withDivider
					title={t('Accounts_Registration_RequireAdminApproval')}
					description={t('Accounts_Registration_RequireAdminApproval_Description')}
					action={
						<Controller
							name='Accounts_ManuallyApproveNewUsers'
							control={control}
							render={({ field: { value, onChange, ref } }) => (
								<ToggleSwitch
									ref={ref}
									checked={value}
									onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.checked)}
								/>
							)}
						/>
					}
				/>
				<SettingsCardItem
					withDivider
					title={<label htmlFor={secretLinkFieldId}>{t('Accounts_Registration_SecretLink')}</label>}
					description={t('Accounts_Registration_SecretLink_Description')}
				>
					<TextInput id={secretLinkFieldId} readOnly value={secretRegistrationLink} />
				</SettingsCardItem>
			</SettingsCard>

			<Box mbe={8} mbs={24}>
				<SettingsGroupLabel>{t('Accounts_Registration_SignupRequirements')}</SettingsGroupLabel>
			</Box>
			<SettingsCard>
				<SettingsCardItem
					title={t('Accounts_Registration_RequireEmailVerification')}
					description={t('Accounts_Registration_RequireEmailVerification_Description')}
					action={
						<Controller
							name='Accounts_EmailVerification'
							control={control}
							render={({ field: { value, onChange, ref } }) => (
								<ToggleSwitch
									ref={ref}
									checked={value}
									onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.checked)}
								/>
							)}
						/>
					}
				/>
				<SettingsCardItem
					withDivider
					title={t('Accounts_Registration_RequireFullName')}
					description={t('Accounts_Registration_RequireFullName_Description')}
					action={
						<Controller
							name='Accounts_RequireNameForSignUp'
							control={control}
							render={({ field: { value, onChange, ref } }) => (
								<ToggleSwitch
									ref={ref}
									checked={value}
									onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.checked)}
								/>
							)}
						/>
					}
				/>
				<SettingsCardItem
					withDivider
					title={t('Accounts_Registration_RequirePasswordConfirmation')}
					description={t('Accounts_Registration_RequirePasswordConfirmation_Description')}
					action={
						<Controller
							name='Accounts_RequirePasswordConfirmation'
							control={control}
							render={({ field: { value, onChange, ref } }) => (
								<ToggleSwitch
									ref={ref}
									checked={value}
									onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.checked)}
								/>
							)}
						/>
					}
				/>
			</SettingsCard>
		</Box>
	);
};

export default RegistrationSection;
