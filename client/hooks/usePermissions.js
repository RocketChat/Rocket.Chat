import { useReactiveValue } from './useReactiveValue';
import { hasAtLeastOnePermission, hasAllPermission } from '../../app/authorization/client/hasPermission';

export const useAtLeastOnePermission = (permissions, scope) =>
	useReactiveValue(() => hasAtLeastOnePermission(permissions, scope), [permissions, scope]);

export const useAllPermissions = (permissions, scope) =>
	useReactiveValue(() => hasAllPermission(permissions, scope), [permissions, scope]);

export const usePermission = (permission, scope) =>
	useReactiveValue(() => hasAllPermission(permission, scope), [permission, scope]);

export const useViewStatisticsPermission = (scope) => usePermission('view-statistics', scope);
