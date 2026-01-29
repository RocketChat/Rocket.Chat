import { Box, Button, ButtonGroup, Icon, Tag } from '@rocket.chat/fuselage';
import {
    Page,
    PageHeader,
    PageScrollableContentWithShadow,
    GenericTable,
    GenericTableHeader,
    GenericTableHeaderCell,
    GenericTableBody,
    GenericTableRow,
    GenericTableCell,
    ContextualbarHeader,
    ContextualbarTitle,
    ContextualbarClose,
    ContextualbarContent,
    ContextualbarDialog
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import ManagerInvitePanel from './ManagerInvitePanel';
import ManagerMembersPanel from './ManagerMembersPanel';

const ManagerPharmacies = () => {
    const t = useTranslation();
    const router = useRouter();

    // State for Sidebar
    const [context, setContext] = useState<'invite' | 'members' | null>(null);
    const [selectedPharmacy, setSelectedPharmacy] = useState<{ _id: string, name: string, myRoles: string[] } | null>(null);

    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list.managed');

    const { data: pharmacies, isLoading } = useQuery({
        queryKey: ['medsense-pharmacies-list-managed'],
        queryFn: async () => {
            // @ts-ignore
            const { pharmacies } = await getPharmacies({});
            return pharmacies;
        },
    });

    const headers = (
        <>
            <GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='roles'>{t('My_Roles')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='actions' width='x200'>{t('Actions')}</GenericTableHeaderCell>
        </>
    );

    const handleInvite = (pharmacy: any) => {
        setSelectedPharmacy(pharmacy);
        setContext('invite');
    };

    const handleMembers = (pharmacy: any) => {
        setSelectedPharmacy(pharmacy);
        setContext('members');
    };

    const handleClose = () => {
        setContext(null);
        setSelectedPharmacy(null);
    };

    const handleCancel = () => {
        router.navigate('/home');
    };

    return (
        <Page flexDirection='row'>
            <Page>
                <PageHeader title={t('Manage_Pharmacies')}>
                    <ButtonGroup>
                        <Button onClick={handleCancel}>{t('Cancel')}</Button>
                    </ButtonGroup>
                </PageHeader>
                <PageScrollableContentWithShadow>
                    <Box padding='x24'>
                        {isLoading && <Box>{t('Loading')}</Box>}
                        {pharmacies && (
                            <GenericTable>
                                <GenericTableHeader>{headers}</GenericTableHeader>
                                <GenericTableBody>
                                    {pharmacies.map((pharmacy: any) => (
                                        <GenericTableRow key={pharmacy._id}>
                                            <GenericTableCell fontScale='p2' color='default'>{pharmacy.name}</GenericTableCell>
                                            <GenericTableCell>
                                                {pharmacy.myRoles?.map((role: string) => <Tag key={role} variant='secondary'>{role}</Tag>)}
                                            </GenericTableCell>
                                            <GenericTableCell>
                                                <ButtonGroup>
                                                    <Button small onClick={() => handleInvite(pharmacy)} title={t('Invite_Staff')}>
                                                        <Icon name='user-plus' /> {t('Invite')}
                                                    </Button>
                                                    <Button small onClick={() => handleMembers(pharmacy)} title={t('Manage_Members')}>
                                                        <Icon name='team' /> {t('Members')}
                                                    </Button>
                                                </ButtonGroup>
                                            </GenericTableCell>
                                        </GenericTableRow>
                                    ))}
                                </GenericTableBody>
                            </GenericTable>
                        )}
                    </Box>
                </PageScrollableContentWithShadow>
            </Page>

            {context && selectedPharmacy && (
                <ContextualbarDialog>
                    <ContextualbarHeader>
                        <ContextualbarTitle>
                            {context === 'invite' ? t('Invite_Staff') : t('Manage_Members')}
                        </ContextualbarTitle>
                        <ContextualbarClose onClick={handleClose} />
                    </ContextualbarHeader>
                    <ContextualbarContent paddingInline='x16'>
                        {context === 'invite' && (
                            <ManagerInvitePanel pharmacyId={selectedPharmacy._id} />
                        )}
                        {context === 'members' && (
                            <ManagerMembersPanel pharmacyId={selectedPharmacy._id} myRoles={selectedPharmacy.myRoles} />
                        )}
                    </ContextualbarContent>
                </ContextualbarDialog>
            )}
        </Page>
    );
};

export default ManagerPharmacies;
