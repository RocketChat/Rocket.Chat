import { expect, test } from 'vitest';
import { decryptForGroup, decryptMessage, rekeyGroupAndEncrypt, type EncryptedData } from '../group';
import { generateRsaOaepKeyPair } from '../rsa';

type SymmetricKey = { key: ArrayBuffer; messageIndex: number };

// In a real application, these would be stored encrypted in a database.
const serverStorage = {
	messages: [] as EncryptedData[],
	symmetricKeys: [] as SymmetricKey[],
};

// --- ENCRYPTION AND STORAGE (Simulated server-side) ---
async function encryptAndStore(plaintext: string, recipientPublicKeys: CryptoKey[]) {
	// 1. Generate new AES key and IV
	const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	const iv = crypto.getRandomValues(new Uint8Array(12));

	// 2. Encrypt the plaintext message
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, aesKey, new TextEncoder().encode(plaintext));

	// 3. Store the encrypted message and IV on the server
	serverStorage.messages.push({ ciphertext, iv });

	// 4. Extract and store the raw symmetric key on the server (encrypted)
	const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
	serverStorage.symmetricKeys.push({ key: rawAesKey, messageIndex: serverStorage.messages.length - 1 });

	// 5. Wrap the raw key for each recipient and distribute
	const wrappedKeys = await Promise.all(recipientPublicKeys.map((key) => crypto.subtle.wrapKey('raw', aesKey, key, { name: 'RSA-OAEP' })));
	return { ciphertext, wrappedKeys, iv };
}

// --- BACKFILLING FOR A NEW USER (Simulated on server) ---
async function createBackfillPackage(newRecipientPublicKey: CryptoKey) {
	const wrappedSymmetricKeys = await Promise.all(
		serverStorage.symmetricKeys.map(async (keyObject) => {
			const keyToWrap = await crypto.subtle.importKey('raw', keyObject.key, 'AES-GCM', true, ['wrapKey']);
			const wrappedKey = await crypto.subtle.wrapKey('raw', keyToWrap, newRecipientPublicKey, { name: 'RSA-OAEP' });
			return { wrappedKey, messageIndex: keyObject.messageIndex };
		}),
	);

	return {
		messages: serverStorage.messages,
		wrappedSymmetricKeys: wrappedSymmetricKeys,
	};
}

test('backfilling', async () => {
	// --- Step 1: Initialize group with Alice and Bob ---
	const aliceKeyPair = await generateRsaOaepKeyPair();
	const bobKeyPair = await generateRsaOaepKeyPair();
	let groupMembers = [aliceKeyPair, bobKeyPair];
	let recipientPublicKeys = groupMembers.map((m) => m.publicKey);

	// --- Step 2: Simulate initial messages from Alice and Bob ---
	await encryptAndStore('Hello from Alice!', recipientPublicKeys);
	await encryptAndStore("Hey Alice, how's it going?", recipientPublicKeys);

	// --- Step 3: Add new user, Charlie ---
	const charlieKeyPair = await generateRsaOaepKeyPair();
	groupMembers.push(charlieKeyPair);
	recipientPublicKeys = groupMembers.map((m) => m.publicKey);

	// --- Step 4: Create backfill package for Charlie ---
	const charlieBackfillPackage = await createBackfillPackage(charlieKeyPair.publicKey);

	// --- Step 5: Charlie decrypts all messages ---
	const decryptedMessages: string[] = [];
	for (const wrappedKeyInfo of charlieBackfillPackage.wrappedSymmetricKeys) {
		const messageIndex = wrappedKeyInfo.messageIndex;
		const messageData = charlieBackfillPackage.messages[messageIndex]!;
		const decryptedMessage = await decryptMessage(messageData, charlieKeyPair.privateKey, wrappedKeyInfo.wrappedKey);
		decryptedMessages.push(decryptedMessage);
	}

	expect(decryptedMessages).toEqual(['Hello from Alice!', "Hey Alice, how's it going?"]);

	// --- Step 6: Send new message with all members ---
	const newMessage = 'Welcome Charlie! This is a new message.';
	const newEncryptedPackage = await rekeyGroupAndEncrypt(recipientPublicKeys, newMessage);
	const decryptedByCharlie = await decryptForGroup(newEncryptedPackage, charlieKeyPair.privateKey, 2);
	expect(decryptedByCharlie).toBe(newMessage);
});
