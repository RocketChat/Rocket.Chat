import { usePermission } from '@rocket.chat/ui-contexts';
import React, { lazy } from 'react';

import { useMainRouteDefinition } from '../../../../../client/hooks/router/useMainRouteDefinition';
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

	useMainRouteDefinition({
		enabled: licensed && permittedToAudit,
		path: '/audit/:tab?',
		id: 'audit-home',
		element: <AuditPage />,
	});

	useMainRouteDefinition({
		enabled: licensed && permittedToAuditLog,
		path: '/audit-log',
		id: 'audit-log',
		element: <AuditLogPage />,
	});
};
