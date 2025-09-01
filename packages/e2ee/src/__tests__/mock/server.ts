import type { EncryptedMessage, EncryptedPrivateKeyBundle, PublicKeyInfo } from '../../crypto';
import type { EncryptedGroupKeyInfo, ChatService } from '../../group';

/**
 * A mock backend chat service for testing purposes.
 * This class simulates a server's database in memory to manage users,
 * groups, and messages, allowing for end-to-end testing of the crypto library.
 */
export class MockChatService implements ChatService {
	// Simulates a 'users' table in a database
	private users = new Map<
		string,
		{
			publicKeyInfo: PublicKeyInfo;
			privateKeyBundle: EncryptedPrivateKeyBundle;
		}
	>();

	// Simulates a 'groups' table
	private groups = new Map<
		string,
		{
			members: Set<string>;
			encryptedGroupKeys: Map<string, EncryptedGroupKeyInfo>;
		}
	>();

	// Simulates a message store for each group
	private messages = new Map<string, EncryptedMessage[]>();

	/**
	 * Simulates registering a user by storing their public key and encrypted private key bundle.
	 */
	public async registerUser(userId: string, publicKeyInfo: PublicKeyInfo, privateKeyBundle: EncryptedPrivateKeyBundle): Promise<void> {
		if (this.users.has(userId)) {
			throw new Error(`User ${userId} already exists.`);
		}
		this.users.set(userId, { publicKeyInfo, privateKeyBundle });
	}

	/**
	 * Simulates fetching user data required for login or recovery.
	 */
	public async getUserData(userId: string): Promise<
		| {
				publicKeyInfo: PublicKeyInfo;
				privateKeyBundle: EncryptedPrivateKeyBundle;
		  }
		| undefined
	> {
		return this.users.get(userId);
	}

	/**
	 * Simulates fetching multiple users' public keys.
	 */
	public async findUsersPublicKeys(userIds: string[]): Promise<Map<string, PublicKeyInfo | undefined>> {
		const result = new Map<string, PublicKeyInfo | undefined>();
		for (const userId of userIds) {
			result.set(userId, await this.findUserPublicKey(userId));
		}
		return result;
	}

	/**
	 * Simulates fetching a user's public key, which is needed to add them to a group.
	 */
	public async findUserPublicKey(userId: string): Promise<PublicKeyInfo | undefined> {
		return this.users.get(userId)?.publicKeyInfo;
	}

	/**
	 * Simulates creating a new group chat.
	 */
	public async createGroup(groupId: string, initialEncryptedKeys: EncryptedGroupKeyInfo[]): Promise<void> {
		if (this.groups.has(groupId)) {
			throw new Error(`Group ${groupId} already exists.`);
		}

		const members = new Set<string>();
		const encryptedGroupKeys = new Map<string, EncryptedGroupKeyInfo>();

		for (const keyInfo of initialEncryptedKeys) {
			members.add(keyInfo.userId);
			encryptedGroupKeys.set(keyInfo.userId, keyInfo);
		}

		this.groups.set(groupId, { members, encryptedGroupKeys });
	}

	/**
	 * Simulates adding a new user to an existing group.
	 */
	public async addUserToGroup(groupId: string, newMemberKeyInfo: EncryptedGroupKeyInfo): Promise<void> {
		const group = this.groups.get(groupId);
		if (!group) {
			throw new Error(`Group ${groupId} not found.`);
		}
		group.members.add(newMemberKeyInfo.userId);
		group.encryptedGroupKeys.set(newMemberKeyInfo.userId, newMemberKeyInfo);
	}

	/**
	 * Simulates a user fetching their specific encrypted group key to join a group.
	 */
	public async getGroupKeyForUser(groupId: string, userId: string): Promise<EncryptedGroupKeyInfo | undefined> {
		return this.groups.get(groupId)?.encryptedGroupKeys.get(userId);
	}

	/**
	 * Simulates posting an encrypted message to a group's message log.
	 */
	public async postMessage(groupId: string, message: EncryptedMessage): Promise<void> {
		if (!this.messages.has(groupId)) {
			this.messages.set(groupId, []);
		}
		this.messages.get(groupId)?.push(message);
	}

	/**
	 * Simulates fetching the entire message history for a group.
	 */
	public async getMessages(groupId: string): Promise<EncryptedMessage[]> {
		return this.messages.get(groupId) || [];
	}
}
