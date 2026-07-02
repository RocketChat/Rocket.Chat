import { Callbacks } from './callbacksBase';

/**
 * Runs while validating whether a username may be used (creation, SSO/LDAP assignment and renames
 * all funnel through `checkUsernameAvailability`). Handlers should throw to reject the username —
 * e.g. a federation bridge rejecting a localpart within its exclusive namespace. With no handler
 * registered this is a no-op.
 */
export const checkUsernameAvailabilityCallback = Callbacks.create<(username: string) => void>('checkUsernameAvailability');
