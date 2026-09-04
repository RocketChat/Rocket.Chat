import type { PresenceScope } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

export type { PresenceScope };

export const NOTHING_HIDDEN: PresenceScope = { hideAll: false };

export const isHiddenFor = (scope: PresenceScope, id: IUser['_id']): boolean => scope.hideAll || Boolean(scope.hidden?.has(id));

export const scopeHidesAnyone = (scope: PresenceScope): boolean => scope.hideAll || Boolean(scope.hidden?.size);

export function hiddenIds(scope: Exclude<PresenceScope, { hideAll: true }>): IUser['_id'][];
export function hiddenIds(scope: PresenceScope): IUser['_id'][] | null;
export function hiddenIds(scope: PresenceScope): IUser['_id'][] | null {
	return scope.hideAll ? null : [...(scope.hidden ?? [])];
}
