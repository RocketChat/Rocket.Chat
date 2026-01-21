import { Modal, ModalHeader, ModalTitle, ModalClose, ModalContent, ModalFooter, Button, ButtonGroup, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { UserAutoComplete } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

const InviteMemberModal = ({ pharmacyId, onClose }: { pharmacyId: string; onClose: () => void }) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const queryClient = useQueryClient();
    const [username, setUsername] = useState('');

    const inviteMember = useEndpoint('POST', '/v1/medsense/pharmacies.members.invite');

    const handleInvite = async () => {
        try {
            await inviteMember({ pharmacyId, username, roles: ['staff'] });
            dispatchToastMessage({ type: 'success', message: t('User_invited') });
            queryClient.invalidateQueries({ queryKey: ['medsense-pharmacy-members', pharmacyId] });
            onClose();
        } catch (error: any) {
            dispatchToastMessage({ type: 'error', message: error });
        }
    };

    const handleChange = (value: unknown) => {
        if (typeof value === 'string') {
            setUsername(value);
        }
    };

    return (
        <Modal>
            <ModalHeader>
                <ModalTitle>{t('Invite_Member')}</ModalTitle>
                <ModalClose onClick={onClose} />
            </ModalHeader>
            <ModalContent>
                <Field>
                    <FieldLabel>{t('Username')}</FieldLabel>
                    <FieldRow>
                        <UserAutoComplete
                            value={username}
                            onChange={handleChange}
                            conditions={{ roles: { $ne: 'patient' } }}
                        />
                    </FieldRow>
                </Field>
            </ModalContent>
            <ModalFooter>
                <ButtonGroup align='end'>
                    <Button onClick={onClose}>{t('Cancel')}</Button>
                    <Button primary onClick={handleInvite} disabled={!username}>
                        {t('Invite')}
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </Modal>
    );
};

export default InviteMemberModal;
