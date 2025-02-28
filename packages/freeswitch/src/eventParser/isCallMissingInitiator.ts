// Returns true when neither side of the call is the user who initiated it
export function isCallMissingInitiator(eventData: Record<string, string | undefined>): boolean {
	const allDirections = [eventData['Call-Direction'], eventData['Other-Leg-Direction'], eventData['Caller-Direction']];

	return !allDirections.includes('inbound');
}
