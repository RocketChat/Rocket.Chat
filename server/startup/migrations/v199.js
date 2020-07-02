<<<<<<< HEAD
import { fork } from 'child_process';

import { Migrations } from '../../../app/migrations/server';
import { getLocalSrc } from '../../../app/events/server/lib/getLocalSrc';
import { getFederationDomain } from '../../../app/federation/server/lib/getFederationDomain';

Migrations.add({
	version: 190,
	up() {
		Promise.await(new Promise((resolve, reject) => {
			const prc = fork(Assets.absoluteFilePath('migrations/v192/v1ToV2.js'), {
				env: {
					LOCAL_SRC: getLocalSrc(),
					FEDERATION_DOMAIN: getFederationDomain(),
					MONGO_URL: process.env.MONGO_URL,
				},
			});

			prc.on('exit', function(code) {
				console.log(`process exit code ${ code }`);

				if (code === 0) {
					resolve();
				} else {
					reject('Error running external script');
				}
			});
		}));
	},
	down() {
	// Once you go 175 you never go back
=======
import { Migrations } from '../../../app/migrations/server';
import { Messages, Rooms } from '../../../app/models/server';
import { trash } from '../../../app/models/server/models/_BaseDb';

Migrations.add({
	version: 192,
	up() {
		try {
			trash._dropIndex({ collection: 1 });
		} catch {
			//
		}

		Messages.tryDropIndex({ rid: 1, ts: 1 });

		Rooms.tryDropIndex({ 'tokenpass.tokens.token': 1 });
		Rooms.tryEnsureIndex({ 'tokenpass.tokens.token': 1 }, { sparse: true });

		Rooms.tryDropIndex({ default: 1 });
		Rooms.tryEnsureIndex({ default: 1 }, { sparse: true });

		Rooms.tryDropIndex({ featured: 1 });
		Rooms.tryEnsureIndex({ featured: 1 }, { sparse: true });

		Rooms.tryDropIndex({ muted: 1 });
		Rooms.tryEnsureIndex({ muted: 1 }, { sparse: true });
>>>>>>> develop
	},
});
