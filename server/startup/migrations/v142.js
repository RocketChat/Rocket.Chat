import { Migrations } from '../../../app/migrations/server';

import { Users, FederationPeers } from '../../../app/models/server';

Migrations.add({
  version: 141,
  up() {
    const users = Users.find({ federation: { $exists: true } }).fetch();

    let peers = [...new Set(users.map(u => u.federation.peer))];

    peers = peers.map(peer => ({
      active: false,
      peer,
      last_seen_at: null,
    }));

    FederationPeers.model.rawCollection().insertMany(peers);
  },
});
