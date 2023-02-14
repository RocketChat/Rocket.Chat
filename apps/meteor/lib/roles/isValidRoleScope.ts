import type { IRole } from '@rocket.chat/core-typings';

export const isValidRoleScope = (scope: IRole['scope']): boolean => ['Users', 'Subscriptions'].includes(scope);
