import { Base } from './_Base';

class FederationPeersModel extends Base {
  constructor() {
    super('federation_peers');
  }

  updateStatuses(seenPeers) {
    for (const peer of Object.keys(seenPeers)) {
      const seen = seenPeers[peer];

      const updateQuery = {};

      if (seen) {
        updateQuery.active = true;
        updateQuery.last_seen_at = new Date();
      } else {
        updateQuery.active = false;
      }

      this.update({ peer }, { $set: updateQuery });
    }
  }
}

export const FederationPeers = new FederationPeersModel();
