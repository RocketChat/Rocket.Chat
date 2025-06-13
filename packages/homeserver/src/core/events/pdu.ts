import type { EventBase } from './eventBase';

/**
 * PDU (Persistent Data Unit) as defined in the Matrix specification
 * A PDU is an event that is persisted in the room history
 *
 * According to the Matrix spec, PDUs are room events that are broadcast
 * to other servers and retained in history. They have authorization rules
 * and are signed by the originating server.
 *
 * @see https://spec.matrix.org/latest/server-server-api/#pdus
 */
export interface MatrixPDU extends EventBase {
	// PDUs in Matrix are extensible and may have additional fields
	// based on the room version and event type
	[key: string]: unknown;
}

/**
 * Response from a federation server containing PDUs (Persistent Data Units)
 */
export interface FederationEventResponse extends EventBase {
	pdus: MatrixPDU[];
}

export const isFederationEventWithPDUs = (
	response: EventBase,
): response is FederationEventResponse => {
	return (
		'pdus' in response &&
		Array.isArray(response.pdus) &&
		response.pdus.length > 0
	);
};
