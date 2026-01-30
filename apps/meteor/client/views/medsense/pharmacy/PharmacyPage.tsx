import { Button } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import PharmacyTable from './PharmacyTable';

const PharmacyPage = () => {
    const t = useTranslation();
    const router = useRouter();
    const [params] = useState({ text: '', current: 0, itemsPerPage: 25 });
    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');
    const { data, isLoading } = useQuery({
        queryKey: ['medsense-pharmacies', params],
        queryFn: async () => getPharmacies(),
    });
    const showCreateButton = !isLoading && (data?.pharmacies?.length ?? 0) > 0;

    return (
        <Page flexDirection='row'>
            <Page>
                <PageHeader title={t('Pharmacies')}>
                    {showCreateButton && (
                        <Button primary onClick={() => router.navigate('/admin/pharmacies/new')}>
                            {t('Create_Pharmacy')}
                        </Button>
                    )}
                </PageHeader>
                <PageContent>
                    <PharmacyTable />
                </PageContent>
            </Page>
        </Page>
    );
};

export default PharmacyPage;


