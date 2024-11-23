import React, { lazy } from 'react';

import { hasAllPermission } from '../../app/authorization/client';
import { appLayout } from '../lib/appLayout';
import { onToggledFeature } from '../lib/onToggledFeature';
import { router } from '../providers/RouterProvider';
import NotAuthorizedPage from '../views/notAuthorized/NotAuthorizedPage';
import MainLayout from '../views/root/MainLayout';

const AuditPage = lazy(() => import('../views/audit/AuditPage'));
const AuditLogPage = lazy(() => import('../views/audit/AuditLogPage'));

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'audit-home': {
			pathname: '/audit';
			pattern: '/audit/:tab?';
		};
		'audit-log': {
			pathname: '/audit-log';
			pattern: '/audit-log';
		};
	}
}

const PermissionGuard = ({ children, permission }: { children: React.ReactNode; permission: string }) => {
	const canView = hasAllPermission(permission);

	return <>{canView ? children : <NotAuthorizedPage />}</>;
};

let unregisterAuditRoutes: () => void;

onToggledFeature('auditing', {
	up: () => {
		unregisterAuditRoutes = router.defineRoutes([
			{
				path: '/audit/:tab?',
				id: 'audit-home',
				element: appLayout.wrap(
					<MainLayout>
						<PermissionGuard permission='can-audit'>
							<AuditPage />
						</PermissionGuard>
					</MainLayout>,
				),
			},
			{
				path: '/audit-log',
				id: 'audit-log',
				element: appLayout.wrap(
					<MainLayout>
						<PermissionGuard permission='can-audit-log'>
							<AuditLogPage />
						</PermissionGuard>
					</MainLayout>,
				),
			},
		]);
	},
	down: () => {
		unregisterAuditRoutes();
	},
});
