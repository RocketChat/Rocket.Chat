import { PolicyRegistry } from '@rocket.chat/dcs';

/**
 * The security policies this instance enforces, kept in sync with the DCS_Policy setting.
 */
export const policies = new PolicyRegistry();
