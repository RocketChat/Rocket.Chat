export const escapeExternalFederationEventId = (externalEventId: string): string => {
	return externalEventId.replace(/\$/g, '__sign__');
};

export const unescapeExternalFederationEventId = (externalEventId: string): string => {
	return externalEventId.replace(/__sign__/g, '$');
};
