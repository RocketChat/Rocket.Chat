import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React from 'react';

const PharmacyItemMenu = ({ pharmacyId }: { pharmacyId: string }) => {
    const t = useTranslation();
    const router = useRouter();

    const handleEdit = () => {
        router.navigate(`/admin/pharmacies/edit/${pharmacyId}`);
    };

    const items = [
        {
            id: 'edit',
            icon: 'edit',
            content: t('Edit'),
            onClick: handleEdit,
        },
    ];

    return <GenericMenu items={items} placement='bottom-end' />;
};

export default PharmacyItemMenu;
