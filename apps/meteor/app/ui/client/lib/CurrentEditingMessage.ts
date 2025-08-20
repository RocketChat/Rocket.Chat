import type { ChatAPI } from '../../../../client/lib/chats/ChatAPI';
import { clearHighlightMessage } from '../../../../client/views/room/MessageList/providers/messageHighlightSubscription';

export class CurrentEditingMessage {
	private lock = false;

	private mid?: string;

	private composer: ChatAPI['composer'] | undefined;

	private data: ChatAPI['data'];

	private params: { tmid?: string };

	private queue: {
		resolve: (release: () => void) => void;
	}[] = [];

	constructor(data: ChatAPI['data'], params: { tmid?: string }, composer?: ChatAPI['composer']) {
		this.composer = composer;
		this.data = data;
		this.params = params;
	}

	public reset = async () => {
		return this.runExclusive(async () => {
			if (!this.composer || !this.mid) {
				return false;
			}

			const message = await this.data.findMessageByID(this.mid);

			if (this.composer.text !== message?.msg) {
				this.composer.setText(message?.msg ?? '');
				return true;
			}

			return false;
		});
	};

	public stop = async () => {
		await this.runExclusive(async () => {
			if (!this.composer || !this.mid) {
				return;
			}

			const message = await this.data.findMessageByID(this.mid);
			const draft = this.composer.text;

			if (draft === message?.msg) {
				await this.data.discardDraft(this.mid);
			} else {
				await this.data.saveDraft(this.mid, (await this.data.getDraft(this.mid)) || draft);
			}

			this.composer.setEditingMode(false);
			this.mid = undefined;
			clearHighlightMessage();
		});
	};

	public cancel = async () => {
		await this.runExclusive(async () => {
			if (!this.mid) {
				return;
			}

			await this.data.discardDraft(this.mid);
			await this.stop();
			this.composer?.setText((await this.data.getDraft(undefined)) ?? '');
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

			if (!this.params.tmid) {
				await this.cancel();
			}

			this.composer?.clear();

			this.dispatch();
		};
	};

	public getMID() {
		return this.mid;
	}

	public setMID(mid: string) {
		this.mid = mid;
	}

	public getParams() {
		return this.params;
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
