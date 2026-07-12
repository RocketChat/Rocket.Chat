import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AccountsTableOfContents from './components/AccountsTableOfContents';
import type { TableOfContentsEntry } from './components/AccountsTableOfContents';
import { useAccountsSettingsForm } from './hooks/useAccountsSettingsForm';
import RegistrationSection from './sections/RegistrationSection';

const AccountsAdminPage = () => {
	const { t } = useTranslation();
	const { form, save, cancel, isDirty } = useAccountsSettingsForm();

	const registrationRef = useRef<HTMLElement>(null);
	const [activeId, setActiveId] = useState('registration');

	const entries: TableOfContentsEntry[] = [
		{ id: 'registration', label: t('Accounts_Registration_Title') },
		{ id: 'login-sessions', label: t('Accounts_Section_LoginSessions') },
		{ id: 'authentication-security', label: t('Accounts_Section_AuthenticationSecurity') },
		{ id: 'password-policy', label: t('Accounts_Section_PasswordPolicy') },
		{ id: 'profile-self-service', label: t('Accounts_Section_ProfileSelfService') },
		{ id: 'user-directory-search', label: t('Accounts_Section_UserDirectorySearch') },
		{ id: 'avatars', label: t('Accounts_Section_Avatars') },
		{ id: 'default-user-preferences', label: t('Accounts_Section_DefaultUserPreferences') },
		{ id: 'login-integrations', label: t('Accounts_Section_LoginIntegrations') },
	];

	const refs: Record<string, React.RefObject<HTMLElement>> = { registration: registrationRef };

	const handleSelect = (id: string) => {
		setActiveId(id);
		refs[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<FormProvider {...form}>
			<Page>
				<PageHeader title={t('Accounts')}>
					<ButtonGroup>
						<Button onClick={cancel} disabled={!isDirty}>
							{t('Reset')}
						</Button>
						<Button primary onClick={() => save()} disabled={!isDirty}>
							{t('Save_changes')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<Box display='flex' flexGrow={1} height='full' overflow='hidden'>
					<PageScrollableContentWithShadow>
						<Box maxWidth='x640' width='full' marginInline='auto'>
							<Box ref={registrationRef}>
								<RegistrationSection />
							</Box>
						</Box>
					</PageScrollableContentWithShadow>
					<AccountsTableOfContents entries={entries} activeId={activeId} onSelect={handleSelect} />
				</Box>
			</Page>
		</FormProvider>
	);
};

export default AccountsAdminPage;
