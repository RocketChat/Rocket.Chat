import type { ChatAPI } from './chats/ChatAPI';
import { clearHighlightMessage } from '../views/room/MessageList/providers/messageHighlightSubscription';

export class CurrentEditingMessage {
	private lock = false;

	private mid?: string;

	private queue: {
		resolve: (release: () => void) => void;
	}[] = [];

	private chat: ChatAPI;

	constructor(chat: ChatAPI) {
		this.chat = chat;
	}

	public reset = async () => {
		return this.runExclusive(async () => {
			if (!this.chat.composer || !this.mid) {
				return false;
			}

			const message = await this.chat.data.findMessageByID(this.mid);

			if (this.chat.composer.text !== message?.msg) {
				this.chat.composer.setText(message?.msg ?? '');
				return true;
			}

			return false;
		});
	};

	public stop = async ({ messageDeleted = false }: { messageDeleted?: boolean } = {}) => {
		await this.runExclusive(async () => {
			if (!this.mid) {
				return;
			}

			if (messageDeleted) {
				const { mid } = this;
				let roomDraft: string | undefined;
				let roomDraftError: unknown;
				let roomDraftFailed = false;
				let discardDraftError: unknown;
				let discardDraftFailed = false;

				try {
					try {
						roomDraft = await this.chat.data.getDraft(undefined);
					} catch (error) {
						roomDraftError = error;
						roomDraftFailed = true;
					}

					try {
						await this.chat.data.discardDraft(mid);
					} catch (error) {
						discardDraftError = error;
						discardDraftFailed = true;
					}
				} finally {
					this.chat.composer?.clear();
					this.chat.composer?.setText(roomDraft ?? '');
					this.chat.composer?.setEditingMode(false);
					this.mid = undefined;
					clearHighlightMessage();
				}

				if (roomDraftFailed && discardDraftFailed) {
					throw new AggregateError([roomDraftError, discardDraftError], 'Failed to clean up drafts after deleting an edited message');
				}

				if (roomDraftFailed) {
					throw roomDraftError;
				}

				if (discardDraftFailed) {
					throw discardDraftError;
				}

				return;
			}

			if (!this.chat.composer) {
				return;
			}

			const message = await this.chat.data.findMessageByID(this.mid);
			const draft = this.chat.composer.text;

			if (draft === message?.msg) {
				await this.chat.data.discardDraft(this.mid);
			} else {
				await this.chat.data.saveDraft(this.mid, (await this.chat.data.getDraft(this.mid)) || draft);
			}

			this.chat.composer.setEditingMode(false);
			this.mid = undefined;
			clearHighlightMessage();
		});
	};

	public cancel = async () => {
		await this.runExclusive(async () => {
			if (!this.mid) {
				return;
			}

			await this.chat.data.discardDraft(this.mid);
			this.chat.composer?.setText((await this.chat.data.getDraft(undefined)) ?? '');
		});
	};

	private acquire = async () => {
		return new Promise<() => void>((resolve) => {
			this.queue.push({ resolve });
			this.dispatch();
		});
	};

	private dispatch() {
		if (this.lock) {
			return;
		}

		const next = this.queue.shift();

		if (!next) {
			return;
		}

		this.lock = true;
		next.resolve(this.buildRelease());
	}

	private buildRelease = () => {
		return async () => {
			this.lock = false;
			this.dispatch();
		};
	};

	public getMID() {
		return this.mid;
	}

	public setMID(mid: string) {
		this.mid = mid;
	}

	private async runExclusive<T>(callback: () => Promise<T>) {
		const release = await this.acquire();

		try {
			return await callback();
		} finally {
			release();
		}
	}
}
