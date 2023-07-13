import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import React, { lazy, useEffect } from 'react';

import { appLayout } from '../../../../../client/lib/appLayout';
import MainLayout from '../../../../../client/views/root/MainLayout';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const AuditPage = lazy(() => import('../../audit/AuditPage'));
const AuditLogPage = lazy(() => import('../../audit/AuditLogPage'));

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
	const licensed = useHasLicenseModule('auditing') === true;
	const permittedToAudit = usePermission('can-audit');
	const permittedToAuditLog = usePermission('can-audit-log');
	const router = useRouter();

	useEffect(() => {
		if (!licensed || !permittedToAudit) {
			return;
		}

		return router.defineRoutes([
			{
				path: '/audit/:tab?',
				id: 'audit-home',
				element: appLayout.wrap(
					<MainLayout>
						<AuditPage />
					</MainLayout>,
				),
			},
		]);
	}, [licensed, permittedToAudit, router]);

	useEffect(() => {
		if (!licensed || !permittedToAuditLog) {
			return;
		}

		return router.defineRoutes([
			{
				path: '/audit-log',
				id: 'audit-log',
				element: appLayout.wrap(
					<MainLayout>
						<AuditLogPage />
					</MainLayout>,
				),
			},
		]);
	}, [licensed, permittedToAuditLog, router]);
};
