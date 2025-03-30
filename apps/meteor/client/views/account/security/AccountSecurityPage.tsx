import { Box, Accordion, AccordionItem, ButtonGroup, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@rocket.chat/fuselage';
import { useSetting, useTranslation, useUser, useEndpoint } from '@rocket.chat/ui-contexts';
import { useId, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ChangePassword from './ChangePassword';
import EndToEnd from './EndToEnd';
import TwoFactorEmail from './TwoFactorEmail';
import TwoFactorTOTP from './TwoFactorTOTP';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import { startRegistration } from '@simplewebauthn/browser';
interface Passkey {
    id: string;
    name: string;
    createdAt: string;
}
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
    const passwordFormId = useId();
    const registerPasskey = useEndpoint('POST', '/v1/passkey/registerOptions'); 
    const verifyPasskey = useEndpoint('POST', '/v1/passkey/registerVerify'); 
    const [registeredPasskeys, setRegisteredPasskeys] = useState<Passkey[]>([]);
    const handleRegisterPasskey = async () => {
        try {
            const optionsResponse = await registerPasskey({ username: user?.username });
            const attestationResponse = await startRegistration(optionsResponse.options);
            const verificationResponse = await verifyPasskey({ attestationResponse, username: user?.username });
            if (verificationResponse?.success && verificationResponse.passkeyId) {
                setRegisteredPasskeys((prev) => [
                    ...prev,
                    { id: verificationResponse.passkeyId, name: 'New Device', createdAt: new Date().toISOString() },
                ]);
            } else {
                console.error('Passkey registration failed:', verificationResponse?.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error during passkey registration:', error);
        }
    };
    const removePasskey = useEndpoint('POST', '/v1/passkey/remove');
    const handleRemovePasskey = async (passkeyId: string) => {
        try {
            const response = await removePasskey({ username: user?.username, passkeyId });
            if (response.success) {
                setRegisteredPasskeys((prev) => prev.filter((passkey) => passkey.id !== passkeyId));
            } else {
                console.error('Failed to remove passkey:', response.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error removing passkey:', error);
        }
    };
    const fetchUser = useEndpoint('GET', '/v1/users/me');
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetchUser();
                console.log('Fetched user data:', response); 
    
                if (response.user?.services?.passkeys) {
                    const passkeys = response.user.services.passkeys.map((passkey: any) => ({
                        id: passkey.credentialId,
                        name: passkey.name,
                        createdAt: passkey.createdAt,
                    }));
                    console.log('Passkeys to set:', passkeys); 
                    setRegisteredPasskeys(passkeys);
                } else {
                    console.log('No passkeys found or user data issue');
                    setRegisteredPasskeys([]);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };
    
        fetchUserData();
    }, []);
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
                        <AccordionItem title={'Passkeys'} defaultExpanded>
                            <Button primary marginBlock='x8' onClick={handleRegisterPasskey}>
                                {'Register Passkey'}
                            </Button>
                            { user &&
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{'Device Name'}</TableCell>
                                        <TableCell>{'Registered Date'}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {registeredPasskeys.map((passkey) => (
                                        <TableRow key={passkey.id}>
                                            <TableCell>{passkey.name}</TableCell>
                                            <TableCell>{passkey.createdAt}</TableCell>
                                            <TableCell>
                                            <Button onClick={() => handleRemovePasskey(passkey.id)}>
                                                {'Remove'}
                                            </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            }
                        </AccordionItem>
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

