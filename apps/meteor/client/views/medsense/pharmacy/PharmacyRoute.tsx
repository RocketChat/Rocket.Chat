import { useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { lazy } from 'react';

const PharmacyPage = lazy(() => import('./PharmacyPage'));
const EditPharmacy = lazy(() => import('./EditPharmacy'));
const NewPharmacy = lazy(() => import('./NewPharmacy'));

const PharmacyRoute = () => {
    const context = useRouteParameter('context');
    const id = useRouteParameter('id');

    if (context === 'new') {
        return <NewPharmacy />;
    }

    if (context === 'edit' && id) {
        return <EditPharmacy id={id} />;
    }

    return <PharmacyPage />;
};

export default PharmacyRoute;
