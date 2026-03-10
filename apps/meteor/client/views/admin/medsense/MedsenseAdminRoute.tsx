import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import MedsenseAdminPage from './MedsenseAdminPage';

const MedsenseAdminRoute = (): JSX.Element => {
    const canAccessMedsenseAdmin = useAtLeastOnePermission([
        'manage-medsense-documentation-templates',
        'medsense-manage-all-pharmacies',
        'medsense-manage-individual-pharmacy',
    ]);

    if (!canAccessMedsenseAdmin) {
        return <NotAuthorizedPage />;
    }

    return <MedsenseAdminPage />;
};

export default MedsenseAdminRoute;
