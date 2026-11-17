import { Emitter } from '@rocket.chat/emitter';

import { deleteBackgroundImage, readBackgroundImages, writeBackgroundImage } from './backgroundImageDatabase';
import { prepareBackgroundImage } from './prepareBackgroundImage';
import type { BackgroundImage } from '../../devices/BackgroundEffectContext';

export type AccountBackgroundImages = { loaded: boolean; images: BackgroundImage[] };

const NOT_LOADED: AccountBackgroundImages = { loaded: false, images: [] };

/**
 * Each account's background pictures in this browser. Storage failures are ignored: a picture that could not be saved
 * is still offered until the page is closed.
 */
class BackgroundImageStore extends Emitter<{ change: void }> {
	private accounts = new Map<string, AccountBackgroundImages>();

	private loading = new Set<string>();

	get(uid: string): AccountBackgroundImages {
		return this.accounts.get(uid) ?? NOT_LOADED;
	}

	private set(uid: string, next: AccountBackgroundImages) {
		this.accounts.set(uid, next);
		this.emit('change');
	}

	/** Read once per page; every later change goes through this store. */
	load(uid: string) {
		if (this.accounts.has(uid) || this.loading.has(uid)) {
			return;
		}
		this.loading.add(uid);
		void readBackgroundImages(uid)
			.catch(() => [])
			.then((stored) => {
				this.loading.delete(uid);
				const images = stored
					.sort((a, b) => a.addedAt - b.addedAt)
					.map(({ id, name, blob }) => ({ id, name, url: URL.createObjectURL(blob) }));
				// Pictures added while loading go after the stored ones.
				this.set(uid, { loaded: true, images: [...images, ...this.get(uid).images] });
			});
	}

	async add(uid: string, file: File): Promise<BackgroundImage> {
		const blob = await prepareBackgroundImage(file);
		const image: BackgroundImage = { id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(blob) };
		const current = this.get(uid);
		this.set(uid, { ...current, images: [...current.images, image] });
		void writeBackgroundImage({ uid, id: image.id, name: image.name, blob, addedAt: Date.now() }).catch(() => undefined);
		return image;
	}

	remove(uid: string, id: string) {
		const current = this.get(uid);
		const removed = current.images.find((image) => image.id === id);
		this.set(uid, { ...current, images: current.images.filter((image) => image.id !== id) });
		if (removed) {
			URL.revokeObjectURL(removed.url);
		}
		void deleteBackgroundImage(uid, id).catch(() => undefined);
	}
}

export const backgroundImageStore = new BackgroundImageStore();
