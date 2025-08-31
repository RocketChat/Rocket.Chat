import { test, expect } from 'vitest';
import { generateRsaOaepKeyPair } from '../rsa';
import { decryptForGroup, rekeyGroupAndEncrypt } from '../group';

test('rekeying', async () => {
	// --- ENCRYPTION FOR A NEW KEY ---

	// --- EXAMPLE USAGE ---
	// --- Step 1: Initialize group with Alice and Bob ---
	const aliceKeyPair = await generateRsaOaepKeyPair();
	const bobKeyPair = await generateRsaOaepKeyPair();
	let recipientPublicKeys = [aliceKeyPair.publicKey, bobKeyPair.publicKey];

	// --- Step 2: Encrypt initial message ---
	const initialMessage = 'Hello everyone! The group chat is open.';
	let encryptedPackage = await rekeyGroupAndEncrypt(recipientPublicKeys, initialMessage);
	console.log(`\nAlice and Bob successfully receive: "${await decryptForGroup(encryptedPackage, aliceKeyPair.privateKey, 0)}"`);

	// --- Step 3: Add new user, Charlie ---
	const charlieKeyPair = await generateRsaOaepKeyPair();
	recipientPublicKeys.push(charlieKeyPair.publicKey);

	// --- Step 4: Rekey the group with a new message for Charlie ---
	const secondMessage = 'Welcome Charlie! This is a new message only you and other members can see.';
	let newEncryptedPackage = await rekeyGroupAndEncrypt(recipientPublicKeys, secondMessage);

	// --- Step 5: Verify decryption for all members ---
	const decryptedByAlice = await decryptForGroup(newEncryptedPackage, aliceKeyPair.privateKey, 0);
	const decryptedByBob = await decryptForGroup(newEncryptedPackage, bobKeyPair.privateKey, 1);
	const decryptedByCharlie = await decryptForGroup(newEncryptedPackage, charlieKeyPair.privateKey, 2);

	expect(decryptedByCharlie).toBe(secondMessage);
	expect(decryptedByAlice).toBe(secondMessage);
	expect(decryptedByBob).toBe(secondMessage);

	const oldMessageDecryptedByAlice = await decryptForGroup(encryptedPackage, aliceKeyPair.privateKey, 0);
	const oldMessageDecryptedByBob = await decryptForGroup(encryptedPackage, bobKeyPair.privateKey, 1);
	const oldMessageDecryptedByCharlie = await decryptForGroup(encryptedPackage, charlieKeyPair.privateKey, 2);

	expect(oldMessageDecryptedByAlice).toBe(initialMessage);
	expect(oldMessageDecryptedByBob).toBe(initialMessage);
	expect(oldMessageDecryptedByCharlie).toBe(initialMessage);
});
