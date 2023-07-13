import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import React, { lazy, useEffect } from 'react';

import { appLayout } from '../../../../../client/lib/appLayout';
import NotAuthorizedPage from '../../../../../client/views/notAuthorized/NotAuthorizedPage';
import MainLayout from '../../../../../client/views/root/MainLayout';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const AuditPage = lazy(() => import('../../audit/AuditPage'));
const AuditLogPage = lazy(() => import('../../audit/AuditLogPage'));

const PermissionGuard = ({ children, permission }: { children: React.ReactNode; permission: string }) => {
	const canView = usePermission(permission);

	return canView ? <>{children}</> : <NotAuthorizedPage />;
};

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

export const useAuditing = () => {
	const enabled = useHasLicenseModule('auditing');
	const router = useRouter();

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return router.defineRoutes([
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
	}, [enabled, router]);
};
