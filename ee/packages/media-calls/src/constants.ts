import { callControlFeatureList } from '@rocket.chat/media-signaling';
import type { CallFeature } from '@rocket.chat/media-signaling';

export const DEFAULT_CALL_FEATURES: CallFeature[] = ['audio'];
export const SIP_CALL_FEATURES: CallFeature[] = ['audio', 'transfer', 'hold', 'conference-escalation'];
export const CTI_CALL_FEATURES: CallFeature[] = [...SIP_CALL_FEATURES, ...callControlFeatureList];
/** Features that only make sense when the peer is outside Rocket.Chat; calls between two users never carry them */
export const EXTERNAL_CALL_FEATURES: CallFeature[] = ['conference-escalation'];
export const ESCALATED_CALL_FEATURES: CallFeature[] = ['audio', 'conference-escalation'];
