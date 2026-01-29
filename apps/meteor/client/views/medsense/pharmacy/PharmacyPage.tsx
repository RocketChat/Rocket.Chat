import { Button } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

import PharmacyTable from './PharmacyTable';

const PharmacyPage = () => {
    const t = useTranslation();
    const router = useRouter();

    return (
        <Page flexDirection='row'>
            <Page>
                <PageHeader title={t('Pharmacies')}>
                    <Button primary onClick={() => router.navigate('/admin/pharmacies/new')}>
                        {t('Create_Pharmacy')}
                    </Button>
                </PageHeader>
                <PageContent>
                    <PharmacyTable />
                </PageContent>
            </Page>
        </Page>
    );
};

export default PharmacyPage;
