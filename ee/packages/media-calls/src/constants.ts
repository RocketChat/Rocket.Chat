import { callControlFeatureList } from '@rocket.chat/media-signaling';
import type { CallFeature } from '@rocket.chat/media-signaling';

export const DEFAULT_CALL_FEATURES: CallFeature[] = ['audio'];
export const SIP_CALL_FEATURES: CallFeature[] = ['audio', 'transfer', 'hold', 'conference-escalation'];
export const CTI_CALL_FEATURES: CallFeature[] = [...SIP_CALL_FEATURES, ...callControlFeatureList];
export const ESCALATED_CALL_FEATURES: CallFeature[] = ['audio', 'conference-escalation'];

/** How long a take-over waits for a renegotiation started by the caller to be answered */
export const TAKE_OVER_NEGOTIATION_TIMEOUT = 8000;
export const TAKE_OVER_NEGOTIATION_POLL_INTERVAL = 250;
