import type { InternalPeerInfo, PeerInfo } from '../context';

export function isInternalPeer(info: PeerInfo): info is InternalPeerInfo {
	return 'userId' in info && Boolean(info.userId);
}
