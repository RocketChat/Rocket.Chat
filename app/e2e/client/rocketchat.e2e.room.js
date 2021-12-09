import { Base64 } from 'meteor/base64';

import {
	toArrayBuffer,
	encryptRSA,
	importRSAKey,
} from './helpers';
import { Subscriptions, Messages } from '../../models/client';
import { APIClient } from '../../utils/client';
import { E2EERoomClient } from './E2EERoomClient';

export class E2ERoom extends E2EERoomClient {
	async decryptSubscription() {
		const subscription = Subscriptions.findOne({ rid: this.rid });

		if (!subscription?.lastMessage) {
			return;
		}

		const lastMessage = await this.decryptMessage(subscription.lastMessage, { waitForKey: true });

		Subscriptions.direct.update({
			_id: subscription._id,
		}, {
			$set: {
				'lastMessage.msg': lastMessage.msg,
				'lastMessage.e2e': lastMessage.e2e,
			},
		});
	}

	async decryptPendingMessages() {
		return Messages.find({ rid: this.rid, t: 'e2e', e2e: 'pending' })
			.forEach(async ({ _id, ...msg }) => {
				Messages.direct.update({ _id }, await this.decryptMessage(msg));
			});
	}

	async encryptKeyForOtherParticipants() {
		// Encrypt generated session key for every user in room and publish to subscription model.
		try {
			const { users } = await APIClient.v1.get('e2e.getUsersOfRoomWithoutKey', { rid: this.rid });
			users.forEach((user) => this.encryptForParticipant(user));
		} catch (error) {
			console.error('Error getting room users: ', error);
		}
	}

	async encryptForParticipant(user) {
		let userKey;
		try {
			userKey = await importRSAKey(JSON.parse(user.e2e.public_key), ['encrypt']);
		} catch (error) {
			console.error('Error importing user key: ', error);
			return;
		}
		// const vector = crypto.getRandomValues(new Uint8Array(16));

		// Encrypt session key for this user with his/her public key
		try {
			const encryptedUserKey = await encryptRSA(userKey, toArrayBuffer(this.sessionKeyExportedString));
			// Key has been encrypted. Publish to that user's subscription model for this room.
			await APIClient.v1.post('e2e.updateGroupKey', {
				rid: this.rid,
				uid: user._id,
				key: this.keyID + Base64.encode(new Uint8Array(encryptedUserKey)),
			});
		} catch (error) {
			console.error('Error encrypting user key: ', error);
		}
	}

	provideKeyToUser(keyId) {
		if (this.keyID !== keyId) {
			return;
		}

		this.encryptKeyForOtherParticipants();
	}
}
