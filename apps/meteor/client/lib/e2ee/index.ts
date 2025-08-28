// export * from './rocketchat.e2e';

export type State = 'NOT_STARTED' | 'DISABLED' | 'LOADING_KEYS' | 'READY' | 'SAVE_PASSWORD' | 'ENTER_PASSWORD' | 'ERROR';
export type SessionState =
	| 'NO_PASSWORD_SET'
	| 'NOT_STARTED'
	| 'DISABLED'
	| 'HANDSHAKE'
	| 'ESTABLISHING'
	| 'CREATING_KEYS'
	| 'WAITING_KEYS'
	| 'KEYS_RECEIVED'
	| 'READY'
	| 'ERROR';

export type Event = 'E2E_STATE_CHANGED';

let currentState: State = 'NOT_STARTED';

export const setState = (state: State) => {
	currentState = state;
};

const sessions: Record<string, SessionState> = {};

export const e2e = {
	...console,
	startClient: () => {
		throw new Error('Function not implemented.');
	},
	closeAlert: () => {
		throw new Error('Function not implemented.');
	},
	isReady: () => currentState === 'READY',
	getState: () => currentState,
	setState: (state: State) => {
		currentState = state;
	},
	onStateChanged: (callback: () => void) => {
		// Implementation for state change subscription
		return () => {
			callback;
		};
	},
	async decryptPinnedMessage<T extends { rid: string; attachments?: { text?: string }[] }>(message: T) {
		if (!message.attachments) {
			return message;
		}

		if (!message.attachments[0]) {
			return message;
		}

		if (!message.attachments[0].text) {
			return message;
		}

		const pinnedMessage = message.attachments[0].text;

		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const data = await e2eRoom.decrypt(pinnedMessage);

		if (!data) {
			return message;
		}

		return { ...message, attachments: [data, ...message.attachments.slice(1)] };
	},
	async decryptMessage<T extends { rid: string; msg: string }>(message: T) {
		const e2eRoom = await this.getInstanceByRoomId(message.rid);

		if (!e2eRoom) {
			return message;
		}

		const data = await e2eRoom.decrypt(message.msg);

		if (!data) {
			return message;
		}

		return { ...message, msg: data };
	},
	async decryptFileContent<T extends { rid?: string; content?: { algorithm: string; ciphertext: string } }>(file: T): Promise<T> {
		if (!file.rid) {
			return file;
		}

		const e2eRoom = await this.getInstanceByRoomId(file.rid);

		if (!e2eRoom) {
			return file;
		}

		return e2eRoom.decryptContent(file);
	},
	openSaveE2EEPasswordModal: (password: string) => {
		throw new Error('Function not implemented.', { cause: password });
	},
	decodePrivateKeyFlow: () => {
		throw new Error('Function not implemented.');
	},
	changePassword: (password: string) => {
		throw new Error('Function not implemented.', { cause: password });
	},
	getInstanceByRoomId: async (rid: string) => ({
		decrypt: (data: string) => Promise.resolve({ rid, text: typeof data === 'string' ? data : JSON.stringify(data) }),
		encryptMessage: (_message: unknown) => {
			throw new Error('Function not implemented.');
		},
		encryptMessageContent: async (contentToBeEncrypted: unknown) => {
			throw new Error('Function not implemented.', { cause: contentToBeEncrypted });
		},
		encryptFile: async (file: File) => {
			return {
				key: {},
				iv: '',
				hash: '',
				file,
			};
		},
		getState: () => sessions[rid],
		onStateChange: (callback: () => void) => {
			const sessionId = rid;
			if (!sessions[sessionId]) {
				sessions[sessionId] = 'NOT_STARTED';
			}
			return () => {
				callback;
			};
		},
		shouldConvertReceivedMessages: () => {
			throw new Error('Function not implemented.');
		},
		shouldConvertSentMessages: async (message: { msg: string }) => {
			throw new Error('Function not implemented.', { cause: message });
		},
		resume: () => {
			throw new Error('Function not implemented.');
		},
		pause: () => {
			throw new Error('Function not implemented.');
		},
		async decryptContent<T extends { content?: { algorithm: string; ciphertext: string } }>(data: T) {
			if (data.content && data.content.algorithm === 'rc.v1.aes-sha2') {
				const content = await this.decrypt(data.content.ciphertext);
				Object.assign(data, content);
			}

			return data;
		},
		resetRoomKey: async () => ({
			e2eKey: '',
			e2eKeyId: '',
		}),
	}),
};
