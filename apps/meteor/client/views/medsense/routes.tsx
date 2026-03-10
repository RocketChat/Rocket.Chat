import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
    interface IRouterPaths {
        'medsense-queue': {
            pattern: '/medsense/queue';
            pathname: '/medsense/queue';
        };
        'medsense-documentation': {
            pattern: '/medsense/documentation/:interventionId';
            pathname: '/medsense/documentation/:interventionId';
        };
        'medsense-manage-all-pharmacies': {
            pattern: '/medsense/manage-pharmacies/:tab?';
            pathname: '/medsense/manage-pharmacies';
        };
        'medsense-verify-invite': {
            pattern: '/medsense/verify/:inviteId';
            pathname: '/medsense/verify/:inviteId';
        };
    }
}

export const registerQueueRoute = createRouteGroup(
    'medsense-queue',
    '/medsense/queue',
    lazy(() => import('./queue/QueueRoute')),
);

registerQueueRoute('/', {
    name: 'medsense-queue',
    component: lazy(() => import('./queue/QueueRoute')),
});

export const registerDocumentationRoute = createRouteGroup(
    'medsense-documentation',
    '/medsense/documentation',
    lazy(() => import('./documentation/DocumentationReviewRoute')),
);

registerDocumentationRoute('/:interventionId', {
    name: 'medsense-documentation',
    component: lazy(() => import('./documentation/DocumentationReviewRoute')),
});

export const registerPharmacyRoute = createRouteGroup(
    'medsense-manage-all-pharmacies',
    '/medsense/manage-pharmacies',
    lazy(() => import('./pharmacy/ManagerPharmacies')),
);

registerPharmacyRoute('/:tab?', {
    name: 'medsense-manage-all-pharmacies',
    component: lazy(() => import('./pharmacy/ManagerPharmacies')),
});

export const registerVerifyRoute = createRouteGroup(
    'medsense-verify-invite',
    '/medsense/verify',
    lazy(() => import('./pharmacy/VerifyPharmacyInvite')),
);

registerVerifyRoute('/:inviteId', {
    name: 'medsense-verify-invite',
    component: lazy(() => import('./pharmacy/VerifyPharmacyInvite')),
});
