import { callControlFeatureList } from '@rocket.chat/media-signaling';
import type { CallFeature } from '@rocket.chat/media-signaling';

export const DEFAULT_CALL_FEATURES: CallFeature[] = ['audio'];
export const SIP_CALL_FEATURES: CallFeature[] = ['audio', 'transfer', 'hold', 'conference-escalation'];
export const CTI_CALL_FEATURES: CallFeature[] = [...SIP_CALL_FEATURES, ...callControlFeatureList];
export const ESCALATED_CALL_FEATURES: CallFeature[] = ['audio', 'conference-escalation'];
