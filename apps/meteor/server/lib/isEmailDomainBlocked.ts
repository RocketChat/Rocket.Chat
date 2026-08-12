import { emailDomainDefaultBlackList } from './defaultBlockedDomainsList';

/**
 * Decide whether an email domain should be blocked at registration.
 *
 * The admin-configured blocklist (`Accounts_BlockedDomainsList`) and the
 * built-in default list (`Accounts_UseDefaultBlockedDomainsList`) are
 * independent controls, so the default list must apply on its own even when no
 * custom domain has been configured. Previously both checks were gated behind
 * the custom list being non-empty, so on a stock install the default list was
 * never consulted.
 */
export const isEmailDomainBlocked = (emailDomain: string, blockList: string[], useDefaultList: boolean): boolean =>
	(blockList.length > 0 && blockList.includes(emailDomain)) || (useDefaultList && emailDomainDefaultBlackList.includes(emailDomain));
