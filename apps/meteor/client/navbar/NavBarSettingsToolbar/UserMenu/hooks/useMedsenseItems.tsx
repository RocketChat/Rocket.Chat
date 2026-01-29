import { usePermission } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { MedicalIcon } from '../../../../views/medsense/icons/MedicalIcon';

export const useMedsenseItems = (): GenericMenuItemProps[] => {
    const { t } = useTranslation();
    const router = useRouter();

    // Check permissions
    const canManageAll = usePermission('medsense-manage-all-pharmacies');
    const canManageOwn = usePermission('medsense-manage-individual-pharmacy');
    const canManage = canManageAll || canManageOwn;

    const handleManagePharmacies = useEffectEvent(() => {
        router.navigate('/medsense/manage-pharmacies');
    });

    if (!canManage) {
        return [];
    }

    return [
        {
            id: 'medsense-manage-all-pharmacies',
            iconElement: <MedicalIcon width='20px' height='20px' />, // Or a different icon
            content: t('Manage_Pharmacies'),
            onClick: handleManagePharmacies,
        }
    ];
};
