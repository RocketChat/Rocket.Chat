import type { Cancel as SipCancel, Invitation } from 'sip.js';

import { parseInviteRejectionReasons } from './parseInviteRejectionReasons';

const naturalEndings = [
	'ORIGINATOR_CANCEL',
	'NO_ANSWER',
	'NORMAL_CLEARING',
	'USER_BUSY',
	'NO_USER_RESPONSE',
	'NORMAL_UNSPECIFIED',
] as const;

const priorityErrorEndings = ['USER_NOT_REGISTERED'] as const;

export function getMainInviteRejectionReason(invitation: Invitation, message: SipCancel): string | undefined {
	const parsedReasons = parseInviteRejectionReasons(message);

	for (const ending of naturalEndings) {
		if (parsedReasons.includes(ending)) {
			// Do not emit any errors for normal endings
			return;
		}
	}

	for (const ending of priorityErrorEndings) {
		if (parsedReasons.includes(ending)) {
			// An error definitely happened
			return ending;
		}
	}

	if (invitation?.state === 'Initial') {
		// Call was canceled at the initial state and it was not due to one of the natural reasons, treat it as unexpected
		return parsedReasons.shift();
	}

	console.warn('The call was canceled for an unexpected reason', parsedReasons);
}
