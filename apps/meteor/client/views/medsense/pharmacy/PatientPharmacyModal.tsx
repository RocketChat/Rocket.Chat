import { Modal, ModalHeader, ModalTitle, ModalClose, ModalContent, ModalFooter, Button, ButtonGroup, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect } from 'react';

const PatientPharmacyModal = ({ onClose }: { onClose: () => void }) => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const queryClient = useQueryClient();
    const [pharmacyId, setPharmacyId] = useState('');

    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list.public');
    const getMyPharmacy = useEndpoint('GET', '/v1/medsense/patient.pharmacy.mine');
    const setPharmacy = useEndpoint('POST', '/v1/medsense/patient.pharmacy.set');

    const { data: pharmacyData } = useQuery({
        queryKey: ['public-pharmacies'],
        queryFn: async () => getPharmacies(),
    });

    const { data: myPharmacyData } = useQuery({
        queryKey: ['my-pharmacy'],
        queryFn: async () => getMyPharmacy(),
    });

    useEffect(() => {
        // @ts-ignore
        if (myPharmacyData?.pharmacy?._id) {
            // @ts-ignore
            setPharmacyId(myPharmacyData.pharmacy._id);
        }
    }, [myPharmacyData]);

    const pharmacyOptions = useMemo(
        // @ts-ignore
        () => pharmacyData?.pharmacies?.map((p: any) => [p._id, p.name]) || [],
        [pharmacyData],
    );

    const handleSave = async () => {
        try {
            await setPharmacy({ pharmacyId });
            dispatchToastMessage({ type: 'success', message: t('Saved') });
            queryClient.invalidateQueries({ queryKey: ['my-pharmacy'] });
            onClose();
        } catch (error: any) {
            dispatchToastMessage({ type: 'error', message: error });
        }
    };

    return (
        <Modal>
            <ModalHeader>
                <ModalTitle>{t('Preferred_Pharmacy')}</ModalTitle>
                <ModalClose onClick={onClose} />
            </ModalHeader>
            <ModalContent>
                <Field>
                    <FieldLabel>{t('Select_Pharmacy')}</FieldLabel>
                    <FieldRow>
                        <Select
                            placeholder={t('Select_an_option')}
                            options={pharmacyOptions}
                            value={pharmacyId}
                            onChange={(val) => setPharmacyId(String(val))}
                        />
                    </FieldRow>
                </Field>
            </ModalContent>
            <ModalFooter>
                <ButtonGroup align='end'>
                    <Button onClick={onClose}>{t('Cancel')}</Button>
                    <Button primary onClick={handleSave}>
                        {t('Save')}
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </Modal>
    );
};

export default PatientPharmacyModal;
