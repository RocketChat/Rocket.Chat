import type { ReactNode } from 'react';
import { lazy } from 'react';

import { hasAllPermission } from '../../app/authorization/client';
import { appLayout } from '../lib/appLayout';
import { onToggledFeature } from '../lib/onToggledFeature';
import { router } from '../providers/RouterProvider';
import SettingsProvider from '../providers/SettingsProvider';
import NotAuthorizedPage from '../views/notAuthorized/NotAuthorizedPage';
import MainLayout from '../views/root/MainLayout';

const AuditPage = lazy(() => import('../views/audit/AuditPage'));
const AuditLogPage = lazy(() => import('../views/audit/AuditLogPage'));
const SecurityLogsPage = lazy(() => import('../views/audit/SecurityLogsPage'));

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
		'security-logs': {
			pathname: '/security-logs';
			pattern: '/security-logs';
		};
	}
}

const PermissionGuard = ({ children, permission }: { children: ReactNode; permission: string }) => {
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
			{
				path: '/security-logs',
				id: 'security-logs',
				element: appLayout.wrap(
					<MainLayout>
						<SettingsProvider>
							<PermissionGuard permission='can-audit'>
								<SecurityLogsPage />
							</PermissionGuard>
						</SettingsProvider>
					</MainLayout>,
				),
			},
		]);
	},
	down: () => {
		unregisterAuditRoutes();
	},
});
