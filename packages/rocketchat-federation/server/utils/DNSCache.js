//
// updateDNSEntry
//
export function updateDNSEntry(peer) {
	this.log('updateDNSEntry');

	const { identifier } = peer;

	delete peer._id;

	return RocketChat.models.FederationDNSCache.upsert({ identifier }, peer);
}

//
// updateDNSCache
//
export function updateDNSCache(peers) {
	this.log('updateDNSCache');

	peers = Array.isArray(peers) ? peers : [peers];

	for (const peer of peers) {
		updateDNSEntry.call(this, peer);
	}
}
