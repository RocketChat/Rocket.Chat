import type { PresenceScope } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

export const NOTHING_HIDDEN: PresenceScope = { hideAll: false };

export const isHiddenFor = (scope: PresenceScope, id: IUser['_id']): boolean => scope.hideAll || Boolean(scope.hidden?.has(id));

export const scopeHidesAnyone = (scope: PresenceScope): boolean => scope.hideAll || Boolean(scope.hidden?.size);

export const hiddenIds = (scope: Extract<PresenceScope, { hideAll: false }>): IUser['_id'][] => [...(scope.hidden ?? [])];
