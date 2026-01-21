import {
    GenericTable,
    GenericTableBody,
    GenericTableCell,
    GenericTableHeader,
    GenericTableHeaderCell,
    GenericTableLoadingTable,
    GenericTableRow,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Button, ButtonGroup, Icon, Modal, Box } from '@rocket.chat/fuselage';

import InviteMemberModal from './InviteMemberModal';

const PharmacyMembersTable = ({ pharmacyId }: { pharmacyId: string }) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const queryClient = useQueryClient();
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const toggleInviteModal = () => setInviteModalOpen((prev) => !prev);

    const getMembers = useEndpoint('GET', '/v1/medsense/pharmacies.members.list');
    const removeMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.remove');

    const { data, isLoading, isSuccess } = useQuery({
        queryKey: ['medsense-pharmacy-members', pharmacyId],
        queryFn: async () => getMembers({ pharmacyId }),
    });

    const handleRemove = async (userId: string) => {
        try {
            await removeMember({ pharmacyId, userId });
            dispatchToastMessage({ type: 'success', message: t('User_removed') });
            queryClient.invalidateQueries({ queryKey: ['medsense-pharmacy-members', pharmacyId] });
        } catch (error: any) {
            dispatchToastMessage({ type: 'error', message: error });
        }
    };

    const headers = (
        <>
            <GenericTableHeaderCell key='username'>{t('Username')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='roles'>{t('Roles')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='actions' w={60} />
        </>
    );

    return (
        <>
            <Box display='flex' justifyContent='flex-end' mb={8}>
                <Button primary onClick={toggleInviteModal}>
                    <Icon name='user-plus' size='x20' mie={4} />
                    {t('Invite_Member')}
                </Button>
            </Box>
            {isLoading && (
                <GenericTable>
                    <GenericTableHeader>{headers}</GenericTableHeader>
                    <GenericTableBody>
                        <GenericTableLoadingTable headerCells={4} />
                    </GenericTableBody>
                </GenericTable>
            )}
            {isSuccess && (
                <GenericTable>
                    <GenericTableHeader>{headers}</GenericTableHeader>
                    <GenericTableBody>
                        {/* @ts-ignore */}
                        {data?.members?.map((member: any) => (
                            <GenericTableRow key={member._id}>
                                <GenericTableCell>{member.user?.username}</GenericTableCell>
                                <GenericTableCell>{member.user?.name}</GenericTableCell>
                                <GenericTableCell>{member.roles.join(', ')}</GenericTableCell>
                                <GenericTableCell>
                                    <Button small danger onClick={() => handleRemove(member.userId)}>
                                        <Icon name='trash' />
                                    </Button>
                                </GenericTableCell>
                            </GenericTableRow>
                        ))}
                    </GenericTableBody>
                </GenericTable>
            )}
            {isInviteModalOpen && (
                <InviteMemberModal pharmacyId={pharmacyId} onClose={() => setInviteModalOpen(false)} />
            )}
        </>
    );
};

export default PharmacyMembersTable;
