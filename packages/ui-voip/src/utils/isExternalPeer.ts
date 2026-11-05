import { isInternalPeer } from './isInternalPeer.js';
import { isUnknownPeer } from './isUnknownPeer.js';
import type { ExternalPeerInfo, PeerInfo } from '../context/index.js';

export function isExternalPeer(info: PeerInfo): info is ExternalPeerInfo {
	return !isUnknownPeer(info) && !isInternalPeer(info) && 'number' in info;
}
