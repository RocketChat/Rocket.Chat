import {
    GenericTable,
    GenericTableBody,
    GenericTableCell,
    GenericTableHeader,
    GenericTableHeaderCell,
    GenericTableLoadingTable,
    GenericTableRow,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Button, Icon, Box } from '@rocket.chat/fuselage';

import CreatePharmacyTeamModal from './CreatePharmacyTeamModal';

const PharmacyTeamsTable = ({ pharmacyId }: { pharmacyId: string }) => {
    const t = useTranslation();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const toggleCreateModal = () => setCreateModalOpen((prev) => !prev);

    const getTeams = useEndpoint('GET', '/v1/medsense/pharmacies.available_teams');

    const { data, isLoading, isSuccess } = useQuery({
        queryKey: ['medsense-pharmacy-teams', pharmacyId],
        queryFn: async () => getTeams({ pharmacyId }),
    });

    const headers = (
        <>
            <GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='purpose'>{t('Purpose')}</GenericTableHeaderCell>
            <GenericTableHeaderCell key='livechat'>{t('Livechat_Available')}</GenericTableHeaderCell>
        </>
    );

    return (
        <>
            <Box display='flex' justifyContent='flex-end' mb={8}>
                <Button primary onClick={toggleCreateModal}>
                    <Icon name='plus' size='x20' mie={4} />
                    {t('Create_Team')}
                </Button>
            </Box>
            {isLoading && (
                <GenericTable>
                    <GenericTableHeader>{headers}</GenericTableHeader>
                    <GenericTableBody>
                        <GenericTableLoadingTable headerCells={3} />
                    </GenericTableBody>
                </GenericTable>
            )}
            {isSuccess && (
                <GenericTable>
                    <GenericTableHeader>{headers}</GenericTableHeader>
                    <GenericTableBody>
                        {/* @ts-ignore */}
                        {data?.teams?.map((team: any) => (
                            <GenericTableRow key={team.teamId}>
                                <GenericTableCell>{team.name}</GenericTableCell>
                                <GenericTableCell>{team.purpose}</GenericTableCell>
                                <GenericTableCell>{team.hasLivechatAvailable ? t('Yes') : t('No')}</GenericTableCell>
                            </GenericTableRow>
                        ))}
                    </GenericTableBody>
                </GenericTable>
            )}
            {isCreateModalOpen && (
                <CreatePharmacyTeamModal pharmacyId={pharmacyId} onClose={() => setCreateModalOpen(false)} />
            )}
        </>
    );
};

export default PharmacyTeamsTable;
