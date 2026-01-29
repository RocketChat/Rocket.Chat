import {
    Field,
    FieldLabel,
    FieldRow,
    TextInput,
    Button,
    ButtonGroup,
    FieldGroup,
    Margins,
    Tabs,
    Box,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Icon,
    Skeleton,
    Tag,
    Modal
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { PhoneNumberInput } from '@rocket.chat/web-ui-registration';

type ManagerInvitePanelProps = {
    pharmacyId: string;
};

type Invite = {
    _id: string;
    phone: string;
    code: string;
    createdAt: string;
    expiresAt: string;
    status: string;
    pharmacyId?: string;
    createdBy?: string;
    acceptedBy?: string;
    acceptedAt?: string;
    role?: string;
};

const InviteDetailsModal = ({ invite, onClose }: { invite: Invite; onClose: () => void }) => {
    const t = useTranslation();

    const maskPhone = (phone: string) => {
        if (!phone) return '';
        if (phone.length < 7) return phone;
        return `${phone.slice(0, 2)}***${phone.slice(-4)}`;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <GenericModal
            title={t('Invite_Details')}
            onConfirm={onClose}
            confirmText={t('Close')}
            onClose={onClose}
            icon={null}
        >
            <Box display='flex' flexDirection='column' gap='x16'>
                <Field>
                    <FieldLabel>{t('Status')}</FieldLabel>
                    <Box fontScale='p2' color='default'>{invite.status?.toUpperCase()}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Phone_Number')}</FieldLabel>
                    <Box fontScale='p2' color='default'>{maskPhone(invite.phone)}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Verification_ID')}</FieldLabel>
                    <Box fontScale='c1' color='hint' fontFamily='mono'>{invite._id}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Code')}</FieldLabel>
                    <Box fontScale='c1' color='hint' fontFamily='mono'>{invite.code}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Pharmacy_ID')}</FieldLabel>
                    <Box fontScale='c1' color='hint' fontFamily='mono'>{invite.pharmacyId}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Created_By')}</FieldLabel>
                    <Box fontScale='c1' color='hint' fontFamily='mono'>{invite.createdBy}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Created_At')}</FieldLabel>
                    <Box fontScale='p2' color='default'>{formatDate(invite.createdAt)}</Box>
                </Field>

                <Field>
                    <FieldLabel>{t('Expires_At')}</FieldLabel>
                    <Box fontScale='p2' color='default'>{formatDate(invite.expiresAt)}</Box>
                </Field>

                {invite.acceptedBy && (
                    <>
                        <Field>
                            <FieldLabel>{t('Verified_By')}</FieldLabel>
                            <Box fontScale='c1' color='hint' fontFamily='mono'>{invite.acceptedBy}</Box>
                        </Field>
                        <Field>
                            <FieldLabel>{t('Verified_At')}</FieldLabel>
                            <Box fontScale='p2' color='default'>{formatDate(invite.acceptedAt)}</Box>
                        </Field>
                    </>
                )}
            </Box>
        </GenericModal>
    );
};

const InviteHistoryTable = ({ pharmacyId }: { pharmacyId: string }) => {
    const t = useTranslation();
    const setModal = useSetModal();
    const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());

    const getInvites = useEndpoint('GET', '/v1/medsense/pharmacies.invites.list');
    const { data, isLoading } = useQuery({
        queryKey: ['pharmacy-invites', pharmacyId],
        queryFn: async () => {
            const result = await getInvites({ pharmacyId });
            return result;
        },
        refetchInterval: 10000,
    });

    const toggleReveal = (id: string) => {
        setRevealedCodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'pending':
                return <Tag variant='primary'>{t('Sent')}</Tag>;
            case 'accepted':
                return <Tag variant='success'>{t('Accepted')}</Tag>;
            case 'expired':
                return <Tag variant='danger'>{t('Expired')}</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const showDetails = (invite: Invite) => {
        setModal(<InviteDetailsModal invite={invite} onClose={() => setModal(null)} />);
    };

    if (isLoading) {
        return <Skeleton variant='rect' height={100} />;
    }

    const invites = (data as any)?.invites || [];

    if (invites.length === 0) {
        return <Box mbs='x16' color='hint'>{t('No_invites_found')}</Box>;
    }

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('Phone_Number')}</TableCell>
                    <TableCell>{t('Status')}</TableCell>
                    <TableCell>{t('Sent')}</TableCell>
                    <TableCell>{t('Code')}</TableCell>
                    <TableCell>{t('Details')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {invites.map((invite: Invite) => (
                    <TableRow key={invite._id}>
                        <TableCell>{invite.phone}</TableCell>
                        <TableCell>{getStatusTag(invite.status)}</TableCell>
                        <TableCell>{formatTime(invite.createdAt)}</TableCell>
                        <TableCell>
                            <Box display='flex' alignItems='center'>
                                <Box fontFamily='mono'>
                                    {revealedCodes.has(invite._id) ? invite.code : '******'}
                                </Box>
                                <Button
                                    small
                                    ghost
                                    mis='x8'
                                    onClick={() => toggleReveal(invite._id)}
                                    title={revealedCodes.has(invite._id) ? t('Hide') : t('Reveal')}
                                >
                                    <Icon name={revealedCodes.has(invite._id) ? 'eye-off' : 'eye'} size='x16' />
                                </Button>
                            </Box>
                        </TableCell>
                        <TableCell>
                            <Button small ghost onClick={() => showDetails(invite)} title={t('Details')}>
                                <Icon name='info-circled' size='x20' />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const ManagerInvitePanel = ({ pharmacyId }: ManagerInvitePanelProps) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const setModal = useSetModal();

    const [activeTab, setActiveTab] = useState<'invite' | 'history'>('invite');
    const [isPhoneValid, setIsPhoneValid] = useState(true);

    const nameId = useUniqueId();
    const emailId = useUniqueId();

    const inviteSms = useEndpoint('POST', '/v1/medsense/pharmacies.members.invite.sms');

    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: {
            phone: '',
            name: '',
            email: ''
        }
    });

    const onSubmit = async (data: any) => {
        if (!isPhoneValid) {
            dispatchToastMessage({ type: 'error', message: t('Invalid_phone_number') });
            return;
        }
        try {
            const result = await inviteSms({
                ...data,
                pharmacyId
            });
            // Show verification code in modal
            const code = (result as any).code || '';
            setModal(
                <GenericModal
                    title={t('Invite_Sent')}
                    onConfirm={() => setModal(null)}
                    confirmText={t('Done')}
                >
                    <Box textAlign='center'>
                        <Box fontScale='p1' mbe='x16'>
                            {t('Share_this_verification_code_with_the_staff_member')}
                        </Box>
                        <Box fontScale='h1' fontFamily='mono' p='x16' bg='neutral-200' borderRadius='x4'>
                            {code}
                        </Box>
                    </Box>
                </GenericModal>
            );
            reset({ phone: '', name: '', email: '' });
        } catch (error: any) {
            dispatchToastMessage({ type: 'error', message: error.message });
        }
    };

    return (
        <Box>
            <Tabs>
                <Tabs.Item selected={activeTab === 'invite'} onClick={() => setActiveTab('invite')}>
                    {t('New_Invite')}
                </Tabs.Item>
                <Tabs.Item selected={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                    {t('Invite_History')}
                </Tabs.Item>
            </Tabs>

            <Box p='x16'>
                {activeTab === 'invite' && (
                    <FieldGroup>
                        <Field>
                            <FieldLabel>{t('Phone_Number')}</FieldLabel>
                            <FieldRow>
                                <Controller
                                    name='phone'
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <PhoneNumberInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            onValidityChange={setIsPhoneValid}
                                            name='phone'
                                            id='invitePhoneInput'
                                            defaultCountry='CA'
                                        />
                                    )}
                                />
                            </FieldRow>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor={nameId}>{t('Name')} ({t('Optional')})</FieldLabel>
                            <FieldRow>
                                <Controller
                                    name='name'
                                    control={control}
                                    render={({ field }) => <TextInput {...field} id={nameId} />}
                                />
                            </FieldRow>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor={emailId}>{t('Email')} ({t('Optional')})</FieldLabel>
                            <FieldRow>
                                <Controller
                                    name='email'
                                    control={control}
                                    render={({ field }) => <TextInput {...field} id={emailId} />}
                                />
                            </FieldRow>
                        </Field>

                        <Margins blockStart='x24'>
                            <ButtonGroup stretch>
                                <Button primary onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                                    {t('Send_Invite')}
                                </Button>
                            </ButtonGroup>
                        </Margins>
                    </FieldGroup>
                )}

                {activeTab === 'history' && (
                    <InviteHistoryTable pharmacyId={pharmacyId} />
                )}
            </Box>
        </Box>
    );
};

export default ManagerInvitePanel;
