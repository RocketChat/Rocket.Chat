import {
    Box,
    Callout,
    Button,
    TextInput,
    Field,
    FieldLabel,
    FieldRow,
    FieldGroup,
    Margins,
    Throbber,
    ButtonGroup
} from '@rocket.chat/fuselage';
import { useRouteParameter, useEndpoint, useToastMessageDispatch, useRouter, useUserId, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

const VerifyPharmacyInvite = () => {
    const t = useTranslation();
    const inviteId = useRouteParameter('inviteId');
    const verifyInvite = useEndpoint('POST', '/v1/medsense/pharmacies.members.verify');
    const router = useRouter();
    const dispatchToastMessage = useToastMessageDispatch();
    const userId = useUserId();

    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!code) return;
        setSubmitting(true);
        setError(null);
        try {
            const result = await verifyInvite({ inviteId: inviteId || '', code });
            if (result.success) {
                dispatchToastMessage({ type: 'success', message: t('Successfully_joined_pharmacy') });
                // Redirect to Home or Manager
                router.navigate('/home');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (!userId) {
        // Force login
        // Rocket.Chat usually handles authRequired=true on route but this is a custom page.
        // We might want to show "Please login first" or redirect.
        // If route is registered with current layout, it might show login.
        // If independent, we need to handle it.
        // Assuming we register it as a normal route, user must be logged in. 
        // If not, we should show a login button.
        return (
            <Box display='flex' justifyContent='center' alignItems='center' height='100vh' flexDirection='column'>
                <Box fontScale='h2'>{t('Medsense_Pharmacy_Invite')}</Box>
                <Box marginBlock='x16'>{t('Please_login_to_accept_invite')}</Box>
                <ButtonGroup>
                    <Button primary onClick={() => router.navigate('/login', { replace: true }, { resume: `/medsense/verify/${inviteId}` })}>{t('Login')}</Button>
                    <Button onClick={() => router.navigate('/register', { replace: true }, { resume: `/medsense/verify/${inviteId}` })}>{t('Register')}</Button>
                </ButtonGroup>
            </Box>
        );
    }

    return (
        <Box display='flex' justifyContent='center' alignItems='center' height='100%' width='100%'>
            <Box maxWidth='x400' width='100%'>
                <Box fontScale='h1' textAlign='center' marginBlockEnd='x24'>{t('Join_Pharmacy')}</Box>

                {error && <Callout type='danger' marginBlockEnd='x16'>{error}</Callout>}

                <FieldGroup>
                    <Field>
                        <FieldLabel>{t('Invitation_Code')}</FieldLabel>
                        <FieldRow>
                            <TextInput
                                value={code}
                                onChange={(e: any) => setCode(e.currentTarget.value)}
                                placeholder='6-digit code'
                            />
                        </FieldRow>
                    </Field>

                    <Button primary onClick={handleSubmit} disabled={submitting || !code}>
                        {submitting ? <Throbber inheritColor /> : t('Join')}
                    </Button>
                </FieldGroup>
            </Box>
        </Box>
    );
};

export default VerifyPharmacyInvite;
