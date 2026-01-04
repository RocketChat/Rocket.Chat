import {
    Box,
    Button,
    Field,
    TextInput,
    VerticalBar,
    ButtonGroup,
    ToggleSwitch,
    FieldGroup,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { validateEmail } from '../../../../lib/emailValidator';

type UserCreateProps = {
    onReload: () => void;
    onClose: () => void;
};

const UserCreate = ({ onReload, onClose, ...props }: UserCreateProps) => {
    const { t } = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
    
    const saveUser = useEndpoint('POST', '/v1/users.create');

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: {
            name: '',
            username: '',
            email: '',
            password: '',
            role: 'user',
        },
    });

    const handleSave = useMutableCallback(async (values) => {
        try {
            await saveUser({
                ...values,
                sendWelcomeEmail,
            });
            dispatchToastMessage({ type: 'success', message: t('User_created_successfully') });
            onReload();
            onClose();
        } catch (error: any) {
            // BUGFIX #37992: Intercept internal error key and map to user-friendly i18n string
            if (error.error === 'error-field-unavailable') {
                const field = error.details?.field;

                if (field === 'email') {
                    return dispatchToastMessage({
                        type: 'error',
                        message: t('Email_already_exists'),
                    });
                }
                if (field === 'username') {
                    return dispatchToastMessage({
                        type: 'error',
                        message: t('Username_already_exists'),
                    });
                }

                return dispatchToastMessage({
                    type: 'error',
                    message: t('error-field-unavailable'),
                });
            }

            // CRITICAL FIX: Extract message to avoid [object Object] in Toast
            const message = error.message || error.error || String(error);
            dispatchToastMessage({ type: 'error', message });
        }
    });

    return (
        <VerticalBar.Scrollable {...props}>
            <Box is='form' onSubmit={handleSubmit(handleSave)}>
                <FieldGroup>
                    <Field>
                        <Field.Label>{t('Name')}</Field.Label>
                        <Field.Row>
                            <TextInput {...register('name')} placeholder={t('Name')} />
                        </Field.Row>
                    </Field>
                    <Field>
                        <Field.Label>{t('Username')}</Field.Label>
                        <Field.Row>
                            <TextInput {...register('username', { required: true })} placeholder={t('Username')} />
                        </Field.Row>
                        {errors.username && <Field.Error>{t('error-the-field-is-required', { field: t('Username') })}</Field.Error>}
                    </Field>
                    <Field>
                        <Field.Label>{t('Email')}</Field.Label>
                        <Field.Row>
                            <TextInput
                                {...register('email', {
                                    required: true,
                                    validate: (v) => validateEmail(v),
                                })}
                                placeholder={t('Email')}
                            />
                        </Field.Row>
                        {errors.email && <Field.Error>{t('error-invalid-email')}</Field.Error>}
                    </Field>
                    <Field>
                        <Field.Label>{t('Password')}</Field.Label>
                        <Field.Row>
                            <TextInput {...register('password', { required: true })} type='password' placeholder={t('Password')} />
                        </Field.Row>
                        {/* P2 FIX: Added missing validation error display for password */}
                        {errors.password && <Field.Error>{t('error-the-field-is-required', { field: t('Password') })}</Field.Error>}
                    </Field>
                    <Field>
                        <Field.Row>
                            <Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
                                <Field.Label>{t('Send_welcome_email')}</Field.Label>
                                <ToggleSwitch checked={sendWelcomeEmail} onChange={() => setSendWelcomeEmail(!sendWelcomeEmail)} />
                            </Box>
                        </Field.Row>
                    </Field>
                </FieldGroup>
                <VerticalBar.Footer>
                    <ButtonGroup stretch>
                        <Button onClick={onClose}>{t('Cancel')}</Button>
                        <Button primary disabled={!isDirty} type='submit'>
                            {t('Save')}
                        </Button>
                    </ButtonGroup>
                </VerticalBar.Footer>
            </Box>
        </VerticalBar.Scrollable>
    );
};

export default UserCreate;