import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';

export type SidebarCategory = {
	_id: string;
	name: string;
	/** Subscription room ids (`rid`) that belong to this category. */
	rooms: string[];
};

const STORAGE_KEY = 'sidebarCategories';

const isValidCategory = (value: unknown): value is SidebarCategory =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as SidebarCategory)._id === 'string' &&
	typeof (value as SidebarCategory).name === 'string' &&
	Array.isArray((value as SidebarCategory).rooms) &&
	(value as SidebarCategory).rooms.every((room) => typeof room === 'string');

const read = (): SidebarCategory[] => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isValidCategory) : [];
	} catch {
		return [];
	}
};

/**
 * Per-user sidebar categories persisted in `localStorage`.
 *
 * This is the first iteration of the feature and is intentionally client-only:
 * categories live in the browser and are private to the user. A future iteration
 * will move the source of truth to the server (and add drag-and-drop).
 *
 * A single store instance is shared across the whole tab so every consumer
 * (room list, category menu, modals) reacts to the same state. `localStorage`'s
 * native `storage` event only fires on *other* tabs, so the in-tab updates are
 * driven by the emitter instead.
 */
class SidebarCategoriesStore extends Emitter<{ changed: undefined }> {
	private categories: SidebarCategory[] = read();

	constructor() {
		super();

		if (typeof window !== 'undefined') {
			window.addEventListener('storage', (event) => {
				if (event.key === STORAGE_KEY) {
					this.categories = read();
					this.emit('changed');
				}
			});
		}
	}

	getSnapshot = (): SidebarCategory[] => this.categories;

	subscribe = (callback: () => void): (() => void) => this.on('changed', callback);

	private persist(next: SidebarCategory[]): void {
		this.categories = next;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// Storage may be unavailable (private mode / quota). Keep the in-memory copy.
		}
		this.emit('changed');
	}

	create(name: string, rooms: string[] = []): string {
		const _id = Random.id();
		this.persist([...this.categories, { _id, name, rooms: [...new Set(rooms)] }]);
		return _id;
	}

	remove(_id: string): void {
		this.persist(this.categories.filter((category) => category._id !== _id));
	}

	addRooms(_id: string, rooms: string[]): void {
		this.persist(
			this.categories.map((category) =>
				category._id === _id ? { ...category, rooms: [...new Set([...category.rooms, ...rooms])] } : category,
			),
		);
	}

	/** Replaces the full room set of a category (used by "Manage channels" to add and remove at once). */
	setRooms(_id: string, rooms: string[]): void {
		this.persist(this.categories.map((category) => (category._id === _id ? { ...category, rooms: [...new Set(rooms)] } : category)));
	}

	/** Removes a room from whichever category currently holds it (if any). */
	removeRoom(rid: string): void {
		this.persist(
			this.categories.map((category) =>
				category.rooms.includes(rid) ? { ...category, rooms: category.rooms.filter((room) => room !== rid) } : category,
			),
		);
	}
}

export const sidebarCategories = new SidebarCategoriesStore();
