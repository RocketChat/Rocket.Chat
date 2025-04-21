import type { Cancel as SipCancel } from 'sip.js';

export function parseInviteRejectionReasons(message: SipCancel): string[] {
	try {
		const reasons = message?.request?.headers?.Reason;
		const parsedTextReasons: string[] = [];
		const parsedCauseReasons: string[] = [];
		const rawReasons: string[] = [];

		if (reasons) {
			for (const { raw } of reasons) {
				if (!raw || typeof raw !== 'string') {
					continue;
				}

				const textMatch = raw.match(/text="(.+)"/);
				if (textMatch?.length && textMatch.length > 1) {
					parsedTextReasons.push(textMatch[1]);
					continue;
				}
				const causeMatch = raw.match(/cause=_?(\d+)/);
				if (causeMatch?.length && causeMatch.length > 1) {
					parsedCauseReasons.push(causeMatch[1]);
					continue;
				}

				rawReasons.push(raw);
			}
		}

		return [...parsedTextReasons, ...parsedCauseReasons, ...rawReasons];
	} catch {
		return [];
	}
}
