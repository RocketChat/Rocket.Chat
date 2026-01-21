import { Modal, ModalHeader, ModalTitle, ModalClose, ModalContent, ModalFooter, Button, ButtonGroup, Field, FieldLabel, FieldRow, TextInput, Select } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

const CreatePharmacyTeamModal = ({ pharmacyId, onClose }: { pharmacyId: string; onClose: () => void }) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [purpose, setPurpose] = useState('pharmacist');

    const createTeam = useEndpoint('POST', '/v1/medsense/pharmacies.teams.create');

    const handleCreate = async () => {
        try {
            await createTeam({ pharmacyId, name, purpose });
            dispatchToastMessage({ type: 'success', message: t('Team_created') });
            queryClient.invalidateQueries({ queryKey: ['medsense-pharmacy-teams', pharmacyId] });
            onClose();
        } catch (error: any) {
            dispatchToastMessage({ type: 'error', message: error });
        }
    };

    const purposeOptions: [string, string][] = [
        ['pharmacist', 'Pharmacist'],
        ['tech', 'Tech'],
        ['assistant', 'Assistant'],
    ];

    return (
        <Modal>
            <ModalHeader>
                <ModalTitle>{t('Create_Team')}</ModalTitle>
                <ModalClose onClick={onClose} />
            </ModalHeader>
            <ModalContent>
                <Field>
                    <FieldLabel>{t('Name')}</FieldLabel>
                    <FieldRow>
                        <TextInput value={name} onChange={(e: any) => setName(e.currentTarget.value)} />
                    </FieldRow>
                </Field>
                <Field>
                    <FieldLabel>{t('Purpose')}</FieldLabel>
                    <FieldRow>
                        <Select
                            value={purpose}
                            onChange={(val) => setPurpose(String(val))}
                            options={purposeOptions}
                        />
                    </FieldRow>
                </Field>
            </ModalContent>
            <ModalFooter>
                <ButtonGroup align='end'>
                    <Button onClick={onClose}>{t('Cancel')}</Button>
                    <Button primary onClick={handleCreate} disabled={!name}>
                        {t('Create')}
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </Modal>
    );
};

export default CreatePharmacyTeamModal;
