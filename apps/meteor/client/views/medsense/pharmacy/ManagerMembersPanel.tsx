import {
    Box,
    Menu
} from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

type ManagerMembersPanelProps = {
    pharmacyId: string;
    myRoles: string[];
};

const ManagerMembersPanel = ({ pharmacyId, myRoles }: ManagerMembersPanelProps) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const setModal = useSetModal();
    const queryClient = useQueryClient();

    const getMembers = useEndpoint('GET', '/v1/medsense/pharmacies.members.list');
    const removeMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.remove');
    const updateMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.update');

    const { data: members, isLoading } = useQuery({
        queryKey: ['medsense-pharmacy-members', pharmacyId],
        queryFn: async () => {
            // @ts-ignore
            const result = await getMembers({ pharmacyId });
            // @ts-ignore
            return result.members;
        },
    });

    const isOwner = myRoles.includes('owner');
    const isManager = myRoles.includes('manager');
    const isAdmin = myRoles.includes('admin');

    const handleRemove = (userId: string, username: string) => {
        const onDelete = async () => {
            try {
                await removeMember({ pharmacyId, userId });
                dispatchToastMessage({ type: 'success', message: t('Member_removed') });
                queryClient.invalidateQueries({ queryKey: ['medsense-pharmacy-members', pharmacyId] });
                setModal(null);
            } catch (error: any) {
                dispatchToastMessage({ type: 'error', message: error.message });
            }
        };

        setModal(
            <GenericModal
                variant='danger'
                onConfirm={onDelete}
                onCancel={() => setModal(null)}
                confirmText={t('Remove')}
            >
                {t('Remove_member_warning', { username })}
            </GenericModal>
        );
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateMember({ pharmacyId, userId, roles: [newRole] });
            dispatchToastMessage({ type: 'success', message: t('Role_updated') });
            queryClient.invalidateQueries({ queryKey: ['medsense-pharmacy-members', pharmacyId] });
        } catch (error: any) {
            dispatchToastMessage({ type: 'error', message: error.message });
        }
    };

    // Permission checks
    const canRemoveMember = (targetRoles: string[]): boolean => {
        const targetIsOwner = targetRoles.includes('owner');
        const targetIsManager = targetRoles.includes('manager');

        if (isAdmin) return true;
        if (targetIsOwner) return false;
        if (isOwner) return true;
        if (isManager && !targetIsOwner && !targetIsManager) return true;

        return false;
    };

    const canChangeRole = (): boolean => {
        return isOwner || isAdmin;
    };

    if (isLoading) return <Box padding='x16'>{t('Loading')}</Box>;

    const canChange = canChangeRole();

    return (
        <Box>
            {members?.map((member: any) => {
                const targetRoles: string[] = member.roles || [];
                const currentRole = targetRoles[0] || 'staff';
                const canRemove = canRemoveMember(targetRoles);

                // Build menu options - label must be a string
                // Note: Owner promotion/demotion reserved for global admin only
                const menuOptions: Record<string, { label: string; action: () => void }> = {};

                if (canChange && currentRole !== 'owner') {
                    if (currentRole !== 'manager') {
                        menuOptions['make-manager'] = {
                            label: t('Make_Manager'),
                            action: () => handleRoleChange(member.userId, 'manager'),
                        };
                    }
                    if (currentRole !== 'staff') {
                        menuOptions['make-staff'] = {
                            label: t('Make_Staff'),
                            action: () => handleRoleChange(member.userId, 'staff'),
                        };
                    }
                }

                if (canRemove) {
                    menuOptions['remove'] = {
                        label: t('Remove'),
                        action: () => handleRemove(member.userId, member.user?.username),
                    };
                }

                const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

                return (
                    <Box
                        key={member.userId}
                        display='flex'
                        alignItems='center'
                        paddingBlock='x12'
                        borderBlockEndWidth='default'
                        borderBlockEndColor='stroke-light'
                    >
                        {/* User Info */}
                        <Box flexGrow={1} minWidth={0}>
                            <Box fontScale='p2' fontWeight='600' withTruncatedText>
                                {member.user?.name || member.user?.username}
                            </Box>
                            <Box fontScale='c1' color='hint'>
                                @{member.user?.username}
                            </Box>
                        </Box>

                        {/* Role */}
                        <Box width='x80' textAlign='center' fontScale='c1' color='default'>
                            {roleLabel}
                        </Box>

                        {/* Actions Menu */}
                        <Box width='x40' display='flex' justifyContent='flex-end'>
                            {Object.keys(menuOptions).length > 0 ? (
                                <Menu options={menuOptions} placement='bottom-end' />
                            ) : (
                                <Box width='x28' />
                            )}
                        </Box>
                    </Box>
                );
            })}
            {members?.length === 0 && <Box padding='x16'>{t('No_members_found')}</Box>}
        </Box>
    );
};

export default ManagerMembersPanel;
