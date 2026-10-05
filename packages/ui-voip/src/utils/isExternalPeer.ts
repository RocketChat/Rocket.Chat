import type { ExternalPeerInfo, PeerInfo } from '../context';

export function isExternalPeer(info: PeerInfo): info is ExternalPeerInfo {
	return 'number' in info;
}
