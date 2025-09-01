import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionClient } from '../group';
import { MockChatService } from './mock/server';

describe('EncryptionClient', () => {
	let mockService: MockChatService;

	beforeEach(() => {
		// Reset the mock service and IndexedDB before each test
		mockService = new MockChatService();
		indexedDB.deleteDatabase('e2ee-chat-db');
	});

	describe('User Management', () => {
		it('should register a new user and store their data via the service', async () => {
			const user = new EncryptionClient(mockService);
			const userId = 'alice@example.com';
			const password = 'password123';

			const spy = vi.spyOn(mockService, 'registerUser');

			await user.initialize(userId);
			await user.register(password);

			// Check that the library called the service correctly
			expect(spy).toHaveBeenCalledOnce();
			const userData = await mockService.getUserData(userId);
			expect(userData).toBeDefined();
			expect(userData?.publicKeyInfo.format).toBe('jwk');
		});

		it('should log in a user with a passphrase if key is not local', async () => {
			const registrationService = new MockChatService();
			const registrant = new EncryptionClient(registrationService);
			const userId = 'bob@example.com';
			const password = 'password-bob';

			// 1. Bob registers on one device, populating the service.
			await registrant.initialize(userId);
			await registrant.register(password);

			// 2. Bob tries to log in on a *new device* (simulated by a new instance and empty IndexedDB).
			const loginUser = new EncryptionClient(registrationService);
			await loginUser.initialize(userId);
			await loginUser.login(password);

			// @ts-expect-error - Accessing private property for test verification
			expect(loginUser.userId).toBe(userId);
			// @ts-expect-error
			expect(loginUser.privateKey).not.toBeNull();
		});

		it('should permanently delete the account from the device storage', async () => {
			const user = new EncryptionClient(mockService);
			const userId = 'frank@example.com';
			await user.initialize(userId);
			await user.register('password-frank');

			await user.deleteAccountFromDevice();

			// Verify in-memory session is cleared
			// @ts-expect-error
			expect(user.userId).toBe(false);

			// Verify login fails without a passphrase, proving the key is gone
			const userInNewSession = new EncryptionClient(mockService);
			await userInNewSession.initialize(userId);
			await expect(userInNewSession.login()).rejects.toThrow('Private key not found locally. Passphrase is required for recovery.');
		});
	});

	describe('Full Group Chat End-to-End Flow', () => {
		it('should allow users to create groups, send messages, and for new users to decrypt history', async () => {
			// --- SETUP ---
			// 1. Alice, Bob, and Carol register with the same chat service.
			const alice = new EncryptionClient(mockService);
			const bob = new EncryptionClient(mockService);
			const carol = new EncryptionClient(mockService);

			await alice.initialize('alice');
			await bob.initialize('bob');
			await carol.initialize('carol');

			await alice.register('alice-pass');
			await bob.register('bob-pass');
			await carol.register('carol-pass');

			const groupId = 'tech-enthusiasts';

			// --- GROUP CREATION ---
			// 2. Alice creates a group and invites Bob.
			await alice.createGroup(groupId, ['bob']);

			// --- SEND & RECEIVE ---
			// 3. Alice sends some messages to the group.
			await alice.sendMessage(groupId, 'Hello Bob!');
			await alice.sendMessage(groupId, 'How is the project going?');

			// 4. Bob logs in on his device and joins the group.
			// In a real app, Bob would get a notification. Here we simulate it directly.
			await bob.joinGroup(groupId);

			// 5. Bob fetches the messages and decrypts them.
			const bobsMessages = await bob.getMessages(groupId);
			expect(bobsMessages).toEqual(['Hello Bob!', 'How is the project going?']);

			// --- ADDING A NEW USER ---
			// 6. Alice decides to add Carol to the group.
			await alice.addUserToGroup(groupId, 'carol');

			// 7. Carol joins the group.
			await carol.joinGroup(groupId);

			// 8. Carol fetches the *entire message history* and decrypts it.
			// This confirms a core requirement: new users have access to past messages.
			const carolsMessages = await carol.getMessages(groupId);
			expect(carolsMessages).toEqual(['Hello Bob!', 'How is the project going?']);

			// 9. Bob sends a new message.
			await bob.sendMessage(groupId, 'Hi Alice and Carol! Project is going great.');

			// 10. Alice and Carol fetch the latest messages.
			const alicesFinalMessages = await alice.getMessages(groupId);
			const carolsFinalMessages = await carol.getMessages(groupId);

			const expectedFinalHistory = ['Hello Bob!', 'How is the project going?', 'Hi Alice and Carol! Project is going great.'];

			expect(alicesFinalMessages).toEqual(expectedFinalHistory);
			expect(carolsFinalMessages).toEqual(expectedFinalHistory);
		});
	});
});
