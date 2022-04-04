import type { IRole } from '../../definition/IRole';

export const isValidRoleScope = (scope: IRole['scope']): boolean => ['Users', 'Subscriptions'].includes(scope);
