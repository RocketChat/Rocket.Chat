import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import PharmacyTable from './PharmacyTable';

const PharmacyPage = () => {
    const t = useTranslation();

    return (
        <Page flexDirection='row'>
            <Page>
                <PageHeader title={t('Pharmacies')} />
                <PageContent>
                    <PharmacyTable />
                </PageContent>
            </Page>
        </Page>
    );
};

export default PharmacyPage;
