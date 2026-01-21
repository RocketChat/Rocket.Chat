import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import QueuePage from './QueuePage';

const QueueRoute = (): ReactElement | null => {
    // Permission check? 
    // Ideally check if user is part of any pharmacy team
    // For now we can render and let the page handle empty states or permissions
    // But 'view-all-teams' or 'medsense-manage-pharmacies' might be too strict.
    // We'll rely on server availability checks for now or add a client-side check later.
    return <QueuePage />;
};

export default QueueRoute;
