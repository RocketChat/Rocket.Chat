import { Box, Accordion, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ChangePassword from './ChangePassword';
import EndToEnd from './EndToEnd';
import TwoFactorEmail from './TwoFactorEmail';
import TwoFactorTOTP from './TwoFactorTOTP';

const passwordDefaultValues = { password: '', confirmationPassword: '' };

const AccountSecurityPage = (): ReactElement => {
	const t = useTranslation();

	const methods = useForm({
		defaultValues: passwordDefaultValues,
		mode: 'onBlur',
	});
	const {
		reset,
		formState: { isDirty },
	} = methods;

	const twoFactorEnabled = useSetting('Accounts_TwoFactorAuthentication_Enabled');
	const twoFactorTOTP = useSetting('Accounts_TwoFactorAuthentication_By_TOTP_Enabled');
	const twoFactorByEmailEnabled = useSetting('Accounts_TwoFactorAuthentication_By_Email_Enabled');
	const e2eEnabled = useSetting('E2E_Enable');
	const allowPasswordChange = useSetting('Accounts_AllowPasswordChange');

	const passwordFormId = useUniqueId();

	if (!twoFactorEnabled && !e2eEnabled && !allowPasswordChange) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page>
			<PageHeader title={t('Security')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' color='default'>
					{allowPasswordChange && (
						<FormProvider {...methods}>
							<Accordion>
								<Accordion.Item title={t('Password')} defaultExpanded>
									<ChangePassword id={passwordFormId} />
								</Accordion.Item>
							</Accordion>
						</FormProvider>
					)}
					<Accordion>
						{(twoFactorTOTP || twoFactorByEmailEnabled) && twoFactorEnabled && (
							<Accordion.Item title={t('Two Factor Authentication')}>
								{twoFactorTOTP && <TwoFactorTOTP />}
								{twoFactorByEmailEnabled && <TwoFactorEmail />}
							</Accordion.Item>
						)}
						{e2eEnabled && (
							<Accordion.Item
								title={t('E2E Encryption')}
								aria-label={t('E2E Encryption')}
								defaultExpanded={!twoFactorEnabled}
								data-qa-type='e2e-encryption-section'
							>
								<EndToEnd />
							</Accordion.Item>
						)}
					</Accordion>
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset(passwordDefaultValues)}>{t('Cancel')}</Button>
					<Button form={passwordFormId} primary disabled={!isDirty} type='submit'>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AccountSecurityPage;
