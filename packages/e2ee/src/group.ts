import {
	type EncryptedMessage,
	type EncryptedPrivateKeyBundle,
	type PublicKeyInfo,
	aesDecrypt,
	aesEncrypt,
	createEncryptedPrivateKeyBundle,
	exportPublicKeyInfo,
	generateAesKey,
	importPublicKey,
	recoverPrivateKeyFromBundle,
	rsaDecrypt,
	rsaEncrypt,
	rsaGenerateKeyPair,
} from './crypto';
import { Keychain } from './keychain';

/**
 * Represents an encrypted group key for a specific user.
 */
export interface EncryptedGroupKeyInfo {
	userId: string;
	encryptedKey: string; // Base64
	keyAlgorithm: RsaHashedImportParams;
}

export interface ChatService {
	registerUser(userId: string, publicKeyInfo: PublicKeyInfo, privateKeyBundle: EncryptedPrivateKeyBundle): Promise<void>;
	getUserData(userId: string): Promise<{ publicKeyInfo: PublicKeyInfo; privateKeyBundle: EncryptedPrivateKeyBundle } | undefined>;
	findUserPublicKey(userId: string): Promise<PublicKeyInfo | undefined>;
	findUsersPublicKeys(userIds: string[]): Promise<Map<string, PublicKeyInfo | undefined>>;
	createGroup(groupId: string, initialEncryptedKeys: EncryptedGroupKeyInfo[]): Promise<void>;
	addUserToGroup(groupId: string, newMemberKeyInfo: EncryptedGroupKeyInfo): Promise<void>;
	getGroupKeyForUser(groupId: string, userId: string): Promise<EncryptedGroupKeyInfo | undefined>;
	postMessage(groupId: string, message: EncryptedMessage): Promise<void>;
	getMessages(groupId: string): Promise<EncryptedMessage[]>;
}

export class EncryptionClient {
	private userId: string;
	private privateKey: CryptoKey | false;
	private groupKeys: Map<string, CryptoKey>;
	private keychain: Keychain;
	private chatService: ChatService;

	constructor(userId: string, chatService: ChatService, keychain: Keychain) {
		this.userId = userId;
		this.privateKey = false;
		this.groupKeys = new Map();
		this.chatService = chatService;
		this.keychain = keychain;
	}

	public static async initialize(userId: string, chatService: ChatService): Promise<EncryptionClient> {
		const keychain = await Keychain.init(userId);
		const client = new EncryptionClient(userId, chatService, keychain);
		return client;
	}

	/**
	 * Registers a new user. Generates a key pair and an encrypted private key bundle for recovery.
	 * The public key and the encrypted bundle should be stored on a server.
	 * @param userId A unique identifier for the user.
	 * @param passphrase A secret passphrase for account recovery.
	 */
	public async register(passphrase: string): Promise<void> {
		if (!this.userId) {
			throw new Error('User ID is not set.');
		}
		const { publicKey, privateKey } = await rsaGenerateKeyPair();
		await this.keychain.savePrivateKey(privateKey);
		const publicKeyInfo = await exportPublicKeyInfo(publicKey);
		const privateKeyBundle = await createEncryptedPrivateKeyBundle(privateKey, passphrase);
		await this.chatService.registerUser(this.userId, publicKeyInfo, privateKeyBundle);
		this.privateKey = privateKey;
	}

	/**
	 * Logs in a user. Tries to load the private key from local storage first.
	 * If not found, it uses the passphrase and the server-stored bundle to recover and store it.
	 * @param userId The user's unique identifier.
	 * @param passphrase The user's passphrase (only needed for recovery).
	 * @param privateKeyBundle The recovery bundle from the server (only needed for recovery).
	 */
	public async login(passphrase?: string): Promise<void> {
		let privateKey = await this.keychain.getPrivateKey();

		if (!this.userId) {
			throw new Error('User ID is not set.');
		}

		if (!privateKey) {
			if (!passphrase) {
				throw new Error('Private key not found locally. Passphrase is required for recovery.');
			}
			const userData = await this.chatService.getUserData(this.userId);
			if (!userData) {
				throw new Error(`User ${this.userId} not found.`);
			}
			privateKey = await recoverPrivateKeyFromBundle(userData.privateKeyBundle, passphrase);
			await this.keychain.savePrivateKey(privateKey);
		}
		this.privateKey = privateKey;
	}

	/**
	 * Creates a new group, generates a group key, and distributes it to the initial members.
	 */
	public async createGroup(groupId: string, memberUserIds: string[]): Promise<void> {
		if (!this.privateKey || !this.userId) {
			throw new Error('User is not logged in.');
		}

		const allMemberIds = [...new Set([this.userId, ...memberUserIds])];
		const groupKey = await generateAesKey();
		const encryptedKeyInfos: EncryptedGroupKeyInfo[] = [];
		const publicKeyInfos = await this.chatService.findUsersPublicKeys(allMemberIds);

		for await (const memberId of allMemberIds) {
			const publicKeyInfo = publicKeyInfos.get(memberId);
			if (!publicKeyInfo) {
				throw new Error(`Could not find public key for user ${memberId}`);
			}

			const memberPublicKey = await importPublicKey(publicKeyInfo);
			const encryptedGroupKey = await rsaEncrypt(groupKey, memberPublicKey);

			encryptedKeyInfos.push({
				userId: memberId,
				encryptedKey: encryptedGroupKey,
				keyAlgorithm: publicKeyInfo.algorithm,
			});
		}

		await this.chatService.createGroup(groupId, encryptedKeyInfos);
		this.groupKeys.set(groupId, groupKey);
	}

	/**
	 * Joins a group by fetching and decrypting the group key.
	 */
	public async joinGroup(groupId: string): Promise<void> {
		if (!this.privateKey || !this.userId) {
			throw new Error('User is not logged in.');
		}

		const encryptedKeyInfo = await this.chatService.getGroupKeyForUser(groupId, this.userId);
		if (!encryptedKeyInfo) {
			throw new Error(`No group key found for user ${this.userId} in group ${groupId}.`);
		}

		const groupKey = await rsaDecrypt(encryptedKeyInfo.encryptedKey, this.privateKey);
		this.groupKeys.set(groupId, groupKey);
	}

	/**
	 * Adds a new user to an existing group. This can only be done by a current group member.
	 * @param groupId The ID of the group.
	 * @param newUserPublicKeyInfo The public key info of the new user to add.
	 */
	public async addUserToGroup(groupId: string, newUserId: string): Promise<void> {
		if (!this.privateKey) {
			throw new Error('User is not logged in.');
		}
		const groupKey = this.groupKeys.get(groupId);
		if (!groupKey) {
			throw new Error(`You are not a member of group ${groupId} or key is not loaded.`);
		}
		const publicKeyInfo = await this.chatService.findUserPublicKey(newUserId);
		if (!publicKeyInfo) {
			throw new Error(`Could not find public key for user ${newUserId}`);
		}
		const memberPublicKey = await importPublicKey(publicKeyInfo);
		const encryptedGroupKey = await rsaEncrypt(groupKey, memberPublicKey);
		await this.chatService.addUserToGroup(groupId, {
			userId: newUserId,
			encryptedKey: encryptedGroupKey,
			keyAlgorithm: publicKeyInfo.algorithm,
		});
	}

	/**
	 * Encrypts a message to be sent to a group.
	 * @param groupId The ID of the target group.
	 * @param plaintext The message to send.
	 */
	public async encryptMessage(groupId: string, plaintext: string): Promise<EncryptedMessage> {
		const groupKey = this.groupKeys.get(groupId);
		if (!groupKey) {
			throw new Error(`Not a member of group ${groupId} or key not loaded.`);
		}
		const encryptedMessage = await aesEncrypt(plaintext, groupKey);
		return encryptedMessage;
	}

	/**
	 * Decrypts a message received from a group.
	 * @param groupId The ID of the source group.
	 * @param encryptedMessage The encrypted message object.
	 */
	public async decryptMessage(groupId: string, encryptedMessage: EncryptedMessage): Promise<string> {
		const groupKey = this.groupKeys.get(groupId);
		if (!groupKey) {
			throw new Error(`Not a member of group ${groupId} or key not loaded.`);
		}
		const decryptedMessage = await aesDecrypt(encryptedMessage, groupKey);
		return decryptedMessage;
	}

	/**
	 * Logs out the current user by clearing all sensitive session data from memory.
	 * This includes the private key and any loaded group keys.
	 * Note: This does NOT delete the private key from local device storage (IndexedDB)
	 * to allow for easier login next time.
	 */
	public logout(): void {
		this.userId = '';
		this.privateKey = false;
		this.groupKeys.clear();
	}

	/**
	 * Performs a destructive logout, permanently deleting the user's private key
	 * from the local device storage (IndexedDB) and clearing all session data.
	 * This is intended for use on shared or untrusted devices. The user will need
	 * their passphrase and recovery bundle to log in on this device again.
	 */
	public async deleteAccountFromDevice(): Promise<void> {
		if (!this.userId) {
			// If not logged in, there's nothing to delete.
			console.warn('Attempted to delete account from device, but no user is logged in.');
			return;
		}

		await this.keychain.deletePrivateKey();
		this.logout();
	}

	/**
	 * Encrypts a message and sends it to the server.
	 */
	public async sendMessage(groupId: string, message: string): Promise<void> {
		const groupKey = this.groupKeys.get(groupId);
		if (!groupKey) {
			throw new Error(`Not a member of group ${groupId} or key not loaded.`);
		}
		const encryptedMessage = await aesEncrypt(message, groupKey);
		await this.chatService.postMessage(groupId, encryptedMessage);
	}

	/**
	 * Fetches encrypted messages from the server and decrypts them.
	 */
	public async getMessages(groupId: string): Promise<string[]> {
		const groupKey = this.groupKeys.get(groupId);
		if (!groupKey) {
			throw new Error(`Not a member of group ${groupId} or key not loaded.`);
		}

		const encryptedMessages = await this.chatService.getMessages(groupId);

		// Decrypt all messages in parallel
		const decryptedMessages = await Promise.all(encryptedMessages.map((msg) => aesDecrypt(msg, groupKey)));

		return decryptedMessages;
	}
}
