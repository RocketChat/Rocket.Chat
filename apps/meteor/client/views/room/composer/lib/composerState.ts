/**
 * Decides what the composer is for right now. The order is the rule: several of these can hold at
 * once, and the first one that does is the only one the person is told about.
 */

export type ComposerState =
	| { kind: 'airGappedRestricted' }
	| { kind: 'omnichannel' }
	| { kind: 'federation'; blocked: boolean }
	| { kind: 'anonymous' }
	| { kind: 'readOnly' }
	| { kind: 'archived' }
	| { kind: 'joinWithCode' }
	| { kind: 'blocked' }
	| { kind: 'selectingMessages' }
	| { kind: 'message' };

export type ComposerStateInput = {
	isAirGappedRestricted: boolean;
	isOmnichannel: boolean;
	isFederation: boolean;
	isFederationBlocked: boolean;
	isAnonymous: boolean;
	isReadOnly: boolean;
	isArchived: boolean;
	mustJoinWithCode: boolean;
	isBlockedOrBlocker: boolean;
	isSelectingMessages: boolean;
};

export const resolveComposerState = ({
	isAirGappedRestricted,
	isOmnichannel,
	isFederation,
	isFederationBlocked,
	isAnonymous,
	isReadOnly,
	isArchived,
	mustJoinWithCode,
	isBlockedOrBlocker,
	isSelectingMessages,
}: ComposerStateInput): ComposerState => {
	if (isAirGappedRestricted) {
		return { kind: 'airGappedRestricted' };
	}

	if (isOmnichannel) {
		return { kind: 'omnichannel' };
	}

	if (isFederation) {
		return { kind: 'federation', blocked: isFederationBlocked };
	}

	if (isAnonymous) {
		return { kind: 'anonymous' };
	}

	if (isReadOnly) {
		return { kind: 'readOnly' };
	}

	if (isArchived) {
		return { kind: 'archived' };
	}

	if (mustJoinWithCode) {
		return { kind: 'joinWithCode' };
	}

	if (isBlockedOrBlocker) {
		return { kind: 'blocked' };
	}

	if (isSelectingMessages) {
		return { kind: 'selectingMessages' };
	}

	return { kind: 'message' };
};
