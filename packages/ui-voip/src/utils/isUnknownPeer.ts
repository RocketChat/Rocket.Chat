import type { UnknownPeerInfo, PeerInfo } from '../context';

export function isUnknownPeer(info: PeerInfo): info is UnknownPeerInfo {
	return info.type === 'unknown';
}
