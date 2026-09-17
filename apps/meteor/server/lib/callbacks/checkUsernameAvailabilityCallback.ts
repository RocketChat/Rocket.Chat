import { Callbacks } from './callbacksBase';

/**
 * Discriminates what kind of handle is being validated, so handlers can check the right
 * namespace: `user` for a person's username, `room` for a room/team name. Rooms, teams
 * and users share one local handle namespace.
 */
export type UsernameAvailabilityCheckType = 'user' | 'room';

/**
 * Runs while validating whether a handle may be used (user creation, SSO/LDAP assignment and
 * renames, plus room renames and team creation, all funnel through `checkUsernameAvailability`).
 * Handlers should throw to reject the handle. The `type` tells the handler whether a user or
 * a room/team is being validated. With no handler registered this is a no-op.
 */
export const checkUsernameAvailabilityCallback =
	Callbacks.create<(username: string, type: UsernameAvailabilityCheckType) => void>('checkUsernameAvailability');
