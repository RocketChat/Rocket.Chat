import { Box, Callout } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { useState } from 'react';

import {
	countryOptions,
	logSubmit,
	organizationIndustryOptions,
	organizationSizeOptions,
	validateEmail,
	validatePassword,
	validateUsername,
} from './mocks';
import type { AdminInfoPayload } from '../../forms/AdminInfoForm/AdminInfoForm';
import type { OrganizationInfoPayload } from '../../forms/OrganizationInfoForm/OrganizationInfoForm';
import type { RegisterOfflinePayload } from '../../forms/RegisterOfflineForm/RegisterOfflineForm';
import type { RegisterServerPayload } from '../../forms/RegisterServerForm/RegisterServerForm';
import AdminInfoPage from '../../pages/AdminInfoPage';
import AwaitingConfirmationPage from '../../pages/AwaitingConfirmationPage';
import ConfirmationProcessPage from '../../pages/ConfirmationProcessPage';
import EmailConfirmedPage from '../../pages/EmailConfirmedPage';
import OrganizationInfoPage from '../../pages/OrganizationInfoPage';
import RegisterOfflinePage from '../../pages/RegisterOfflinePage';
import RegisteredServerPage from '../../pages/RegisterServerPage';

export default {
	title: 'flows/Self-Hosted Registration',
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof SelfHostedRegistration>;

export const SelfHostedRegistration = ({ offline }: { offline?: boolean }) => {
	const [path, navigateTo] =
		useState<`/${
			| 'admin-info'
			| 'org-info'
			| 'register-server'
			| 'register-offline'
			| 'cloud-email'
			| 'awaiting'
			| 'home'
			| 'email'
			| 'confirmation-progress'
			| 'email-confirmed'}`>('/admin-info');

	const [adminInfo, setAdminInfo] = useState<Omit<AdminInfoPayload, 'password'>>();

	const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfoPayload>();

	const [serverRegistration, setServerRegistration] = useState<{
		updates?: boolean;
		agreement?: boolean;
		cloudAccountEmail?: string;
		securityCode?: string;
	}>();

	const [offlineRegistration, setOfflineRegistration] = useState<{
		agreement?: boolean;
		token?: string;
	}>();

	const handleAdminInfoSubmit = logSubmit((data: AdminInfoPayload) => {
		setAdminInfo(data);
		navigateTo('/org-info');
	});

	const handleOrganizationInfoSubmit = logSubmit((data: OrganizationInfoPayload) => {
		setOrganizationInfo(data);
		navigateTo('/register-server');
	});

	const handleRegisterServerSubmit = logSubmit((data: RegisterServerPayload) => {
		setServerRegistration((serverRegistration) => ({
			...serverRegistration,
			updates: data.updates,
			agreement: data.agreement,
			cloudAccountEmail: data.email,
			securityCode: 'Funny Tortoise In The Hat',
		}));
		navigateTo('/awaiting');
	});

	const handleRegisterOfflineSubmit = logSubmit((data: RegisterOfflinePayload) => {
		setOfflineRegistration((offlineRegistration) => ({
			...offlineRegistration,
			agreement: data.agreement,
			token: data.token,
		}));
		navigateTo('/awaiting');
	});

	if (path === '/admin-info') {
		return (
			<AdminInfoPage
				currentStep={1}
				stepCount={4}
				passwordRulesHint=''
				validateUsername={validateUsername}
				validateEmail={validateEmail}
				validatePassword={validatePassword}
				initialValues={adminInfo}
				onSubmit={handleAdminInfoSubmit}
			/>
		);
	}

	if (path === '/org-info') {
		return (
			<OrganizationInfoPage
				currentStep={2}
				stepCount={4}
				organizationIndustryOptions={organizationIndustryOptions}
				organizationSizeOptions={organizationSizeOptions}
				countryOptions={countryOptions}
				initialValues={organizationInfo}
				onBackButtonClick={() => navigateTo('/admin-info')}
				onSubmit={handleOrganizationInfoSubmit}
			/>
		);
	}

	if (path === '/register-server') {
		return (
			<RegisteredServerPage
				currentStep={3}
				stepCount={4}
				initialValues={{
					...(serverRegistration?.updates && {
						updates: serverRegistration?.updates,
					}),
					...(serverRegistration?.agreement && {
						agreement: serverRegistration?.agreement,
					}),
				}}
				onSubmit={handleRegisterServerSubmit}
				onClickRegisterOffline={() => navigateTo('/register-offline')}
				offline={offline}
			/>
		);
	}

	if (path === '/register-offline') {
		return (
			<RegisterOfflinePage
				termsHref=''
				policyHref=''
				clientKey=''
				onCopySecurityCode={() => undefined}
				onBackButtonClick={() => navigateTo('/register-server')}
				onSubmit={handleRegisterOfflineSubmit}
			/>
		);
	}

	if (path === '/awaiting') {
		if (!serverRegistration?.cloudAccountEmail || !offlineRegistration?.token) {
			throw new Error('missing cloud account email or token');
		}

		if (!serverRegistration?.securityCode || !offlineRegistration?.token) {
			throw new Error('missing verification code');
		}

		setTimeout(() => {
			navigateTo('/confirmation-progress');
		}, 5000);

		return (
			<AwaitingConfirmationPage
				currentStep={4}
				stepCount={4}
				emailAddress={serverRegistration.cloudAccountEmail}
				securityCode={serverRegistration.securityCode}
				onChangeEmailRequest={() => navigateTo('/admin-info')}
				onResendEmailRequest={() => undefined}
			/>
		);
	}

	if (path === '/confirmation-progress') {
		setTimeout(() => {
			navigateTo('/email-confirmed');
		}, 3000);

		return <ConfirmationProcessPage />;
	}

	if (path === '/email-confirmed') {
		return <EmailConfirmedPage />;
	}

	if (path === '/home') {
		return (
			<Box width='100vw' height='100vh' display='flex' justifyContent='center' alignItems='center'>
				<Callout type='success'>This is the home of the workspace.</Callout>
			</Box>
		);
	}

	throw new Error('invalid path');
};
SelfHostedRegistration.storyName = 'Self-Hosted Registration';

export const SelfHostedRegistrationOffline: StoryFn<typeof SelfHostedRegistration> = () => <SelfHostedRegistration offline />;

SelfHostedRegistrationOffline.storyName = 'Airgapped Self-Hosted Registration';
