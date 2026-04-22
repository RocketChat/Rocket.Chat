import type { IMedsensePharmacy } from '@rocket.chat/core-typings';
import {
    GenericTable,
    GenericTableBody,
    GenericTableCell,
    GenericTableHeader,
    GenericTableHeaderCell,
    GenericTableLoadingTable,
    GenericTableRow,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';

import PharmacyItemMenu from './PharmacyItemMenu';
import { MedicalIcon } from '../icons/MedicalIcon';
import GenericNoResults from '../../../components/GenericNoResults/GenericNoResults';

const PharmacyTable = () => {
    const t = useTranslation();
    const router = useRouter();
    const [params] = useState({ text: '', current: 0, itemsPerPage: 25 });

    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');

    const { data, isSuccess, isLoading } = useQuery({
        queryKey: ['medsense-pharmacies', params],
        queryFn: async () => getPharmacies(),
    });

    const handleAddNew = useEffectEvent(() => router.navigate('/admin/pharmacies/new'));

    const headers = (
        <>
            <GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='slug'>{t('Slug')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='active'>{t('Active')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='voiceInboundNumber'>Voice Number</GenericTableHeaderCell>
            <GenericTableHeaderCell key='url' w={100} />
        </>
    );

    if (isLoading) {
        return (
            <GenericTable>
                <GenericTableHeader>{headers}</GenericTableHeader>
                <GenericTableBody>
                    <GenericTableLoadingTable headerCells={5} />
                </GenericTableBody>
            </GenericTable>
        );
    }

    if (isSuccess && data?.pharmacies.length === 0) {
        return (
            <GenericNoResults
                icon={<MedicalIcon width='48px' height='48px' />}
                title={t('No_pharmacies_yet')}
                buttonAction={handleAddNew}
                buttonTitle={t('Create_Pharmacy')}
            />
        );
    }

    return (
        <GenericTable>
            <GenericTableHeader>{headers}</GenericTableHeader>
            <GenericTableBody>
                {
                    // @ts-ignore
                    data?.pharmacies?.map((pharmacy: IMedsensePharmacy) => (
                        <GenericTableRow key={pharmacy._id} tabIndex={0} width='full'>
                            <GenericTableCell withTruncatedText>{pharmacy.name}</GenericTableCell>
                            <GenericTableCell withTruncatedText>{pharmacy.slug}</GenericTableCell>
                            <GenericTableCell withTruncatedText>{pharmacy.active ? t('Yes') : t('No')}</GenericTableCell>
                            <GenericTableCell withTruncatedText>{pharmacy.voiceInboundNumber || '-'}</GenericTableCell>
                            <GenericTableCell withTruncatedText>
                                <PharmacyItemMenu pharmacyId={pharmacy._id} />
                            </GenericTableCell>
                        </GenericTableRow>
                    ))}
            </GenericTableBody>
        </GenericTable>
    );
};

export default PharmacyTable;
