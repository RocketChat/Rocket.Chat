import type { ExternalPeerInfo, PeerInfo } from '../context';
import { isInternalPeer } from './isInternalPeer';
import { isUnknownPeer } from './isUnknownPeer';

export function isExternalPeer(info: PeerInfo): info is ExternalPeerInfo {
	return !isUnknownPeer(info) && !isInternalPeer(info);
}
