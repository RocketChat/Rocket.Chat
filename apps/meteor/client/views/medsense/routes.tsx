import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
    interface IRouterPaths {
        'medsense-pharmacies': {
            pattern: '/admin/pharmacies/:context?/:id?/:tab?';
            pathname: `/admin/pharmacies${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
        };
        'medsense-queue': {
            pattern: '/medsense/queue';
            pathname: '/medsense/queue';
        };
    }
}

export const registerMedsenseRoute = createRouteGroup(
    'medsense',
    '/admin/pharmacies',
    lazy(() => import('./pharmacy/PharmacyRoute')),
);

registerMedsenseRoute('/:context?/:id?/:tab?', {
    name: 'medsense-pharmacies',
    component: lazy(() => import('./pharmacy/PharmacyRoute')),
});

export const registerQueueRoute = createRouteGroup(
    'medsense-queue',
    '/medsense/queue',
    lazy(() => import('./queue/QueueRoute')),
);

registerQueueRoute('/', {
    name: 'medsense-queue',
    component: lazy(() => import('./queue/QueueRoute')),
});
