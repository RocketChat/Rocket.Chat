import { Box, Select, Icon } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import React, { useMemo } from 'react';

import { usePharmacyFilter } from '../context/PharmacyFilterContext';

export const PharmacyFilter = () => {
    const { t } = useTranslation();
    const { selectedPharmacyId, setSelectedPharmacyId, loading } = usePharmacyFilter();

    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');

    // We want the user's managed/member pharmacies. The list endpoint handles this logic.
    const { data } = useQuery({
        queryKey: ['medsense/pharmacies.list'],
        queryFn: async () => {
            const result = await getPharmacies({});
            return result.pharmacies;
        },
    });

    const options = useMemo(() => {
        const allOption: [string, string] = ['', t('All_Pharmacies')];
        if (!data) return [allOption];

        return [
            allOption,
            ...data.map((p: any) => [p._id, p.name] as [string, string])
        ];
    }, [data, t]);

    return (
        <Box padding="x16" display="flex" alignItems="center" bg="neutral-100" borderBlockEndWidth="default" borderBlockEndColor="extra-light">
            <Icon name="medical" size="x20" mie="x8" color="primary" />
            <Select
                width="100%"
                value={selectedPharmacyId || ''}
                onChange={(val) => setSelectedPharmacyId(val as string || null)}
                options={options}
                placeholder={t('Filter_by_Pharmacy')}
                disabled={loading}
            />
        </Box>
    );
};