import { Box, Accordion, AccordionItem, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import ChangePassword from './ChangePassword';
import EndToEnd from './EndToEnd';
import TwoFactorEmail from './TwoFactorEmail';
import TwoFactorTOTP from './TwoFactorTOTP';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';

const passwordDefaultValues = { password: '', confirmationPassword: '' };

const AccountSecurityPage = (): ReactElement => {
	const t = useTranslation();
	const user = useUser();

	const isEmail2FAAvailableForOAuth = useSetting('Accounts_twoFactorAuthentication_email_available_for_OAuth_users');
	const isOAuthUser = user?.isOAuthUser;
	const isEmail2FAAllowed = !isOAuthUser || isEmail2FAAvailableForOAuth;

	const methods = useForm({
		defaultValues: passwordDefaultValues,
		mode: 'all',
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
	const showEmailTwoFactor = twoFactorByEmailEnabled && isEmail2FAAllowed;

	const passwordFormId = useUniqueId();

	return (
		<Page>
			<PageHeader title={t('Security')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' color='default'>
					{allowPasswordChange && (
						<FormProvider {...methods}>
							<Accordion>
								<AccordionItem title={t('Password')} defaultExpanded>
									<ChangePassword id={passwordFormId} />
								</AccordionItem>
							</Accordion>
						</FormProvider>
					)}
					<Accordion>
						{(twoFactorTOTP || showEmailTwoFactor) && twoFactorEnabled && (
							<AccordionItem title={t('Two Factor Authentication')}>
								{twoFactorTOTP && <TwoFactorTOTP />}
								{showEmailTwoFactor && <TwoFactorEmail />}
							</AccordionItem>
						)}
						{e2eEnabled && (
							<AccordionItem
								title={t('End-to-end_encryption')}
								aria-label={t('End-to-end_encryption')}
								defaultExpanded={!twoFactorEnabled}
								data-qa-type='e2e-encryption-section'
							>
								<EndToEnd />
							</AccordionItem>
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
