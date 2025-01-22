import type { IFreeSwitchEventCall } from '@rocket.chat/core-typings';

export function parseEventCallData(eventData: Record<string, string>): Partial<IFreeSwitchEventCall> {
	const durationStr = eventData.variable_duration;
	const duration = (durationStr && parseInt(durationStr)) || 0;

	const otherLegUniqueId = eventData['Other-Leg-Unique-ID'];

	return {
		UUID: eventData['Channel-Call-UUID'] || eventData.variable_call_uuid,
		state: eventData['Channel-Call-State'],
		previousState: eventData['Original-Channel-Call-State'],
		sipId: eventData.variable_sip_call_id,
		authorized: eventData.variable_sip_authorized,
		answerState: eventData['Answer-State'],
		hangupCause: eventData['Hangup-Cause'],
		duration,
		direction: eventData['Call-Direction'],
		originator: (eventData['Other-Type'] === 'originator' && otherLegUniqueId) || undefined,
		originatee: (eventData['Other-Type'] === 'originatee' && otherLegUniqueId) || undefined,
	};
}
