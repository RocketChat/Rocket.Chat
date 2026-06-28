import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useEndpoint, useToastMessageDispatch, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { toggleFavoriteRoom } from '../../../lib/mutationEffects/room';

export const MAX_CATEGORY_NAME_LENGTH = 30;

export type CategoryNameError = 'empty' | 'duplicate';

/** A room being moved between groupings. */
export type MovableRoom = { rid: string; name: string; isFavorite?: boolean };

/** The `favorites` sentinel is mutually exclusive with the custom categories. */
export const FAVORITES_TARGET = 'favorites';

const EMPTY: ISidebarCustomCategory[] = [];

const stripRoom = (categories: ISidebarCustomCategory[], rid: string): ISidebarCustomCategory[] =>
	categories.map((category) =>
		category.rooms?.includes(rid) ? { ...category, rooms: category.rooms.filter((room) => room !== rid) } : category,
	);

/**
 * Per-user custom sidebar categories, persisted in the `sidebarCustomCategories` user preference.
 * All mutations are silent except `moveRoom`/`createCategoryAndMoveRoom`, which dispatch the move toast.
 */
export const useCustomCategories = () => {
	const { t } = useTranslation();
	const uid = useUserId();
	const dispatchToastMessage = useToastMessageDispatch();
	const categories = useUserPreference<ISidebarCustomCategory[]>('sidebarCustomCategories', EMPTY) ?? EMPTY;

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const toggleFavoriteEndpoint = useEndpoint('POST', '/v1/rooms.favorite');

	const persist = useCallback(
		(next: ISidebarCustomCategory[]) => saveUserPreferences({ data: { sidebarCustomCategories: next } }),
		[saveUserPreferences],
	);

	const setFavorite = useCallback(
		async (rid: string, favorite: boolean) => {
			await toggleFavoriteEndpoint({ roomId: rid, favorite });
			toggleFavoriteRoom(rid, favorite, uid ?? undefined);
		},
		[toggleFavoriteEndpoint, uid],
	);

	const validateName = useCallback(
		(name: string, excludeId?: string): CategoryNameError | undefined => {
			const trimmed = name.trim();
			if (!trimmed) {
				return 'empty';
			}
			const normalized = trimmed.toLowerCase();
			if (categories.some((category) => category._id !== excludeId && category.name.trim().toLowerCase() === normalized)) {
				return 'duplicate';
			}
			return undefined;
		},
		[categories],
	);

	const createCategory = useCallback(
		async (name: string, icon?: string): Promise<ISidebarCustomCategory> => {
			const category: ISidebarCustomCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: true,
				rooms: [],
				...(icon ? { icon } : {}),
			};
			await persist([...categories, category]);
			return category;
		},
		[categories, persist],
	);

	/** Updates a category's name and emoji icon. A falsy `icon` clears it (back to the folder icon). */
	const renameCategory = useCallback(
		(categoryId: string, name: string, icon?: string) =>
			persist(
				categories.map((category) => {
					if (category._id !== categoryId) {
						return category;
					}
					const { icon: _previous, ...rest } = category;
					return { ...rest, name: name.trim(), ...(icon ? { icon } : {}) };
				}),
			),
		[categories, persist],
	);

	const deleteCategory = useCallback(
		(categoryId: string) => persist(categories.filter((category) => category._id !== categoryId)),
		[categories, persist],
	);

	const reorderCategory = useCallback(
		(categoryId: string, direction: 'up' | 'down') => {
			const index = categories.findIndex((category) => category._id === categoryId);
			const targetIndex = direction === 'up' ? index - 1 : index + 1;
			if (index === -1 || targetIndex < 0 || targetIndex >= categories.length) {
				return undefined;
			}
			const next = [...categories];
			[next[index], next[targetIndex]] = [next[targetIndex], next[index]];
			return persist(next);
		},
		[categories, persist],
	);

	const toggleShowUnreads = useCallback(
		(categoryId: string) =>
			persist(
				categories.map((category) =>
					category._id === categoryId ? { ...category, showUnreads: category.showUnreads === false } : category,
				),
			),
		[categories, persist],
	);

	/** Move a room into a custom category (by id) or to Favorites. Assignment is exclusive. */
	const moveRoom = useCallback(
		async (room: MovableRoom, target: string) => {
			const stripped = stripRoom(categories, room.rid);

			if (target === FAVORITES_TARGET) {
				await persist(stripped);
				if (!room.isFavorite) {
					await setFavorite(room.rid, true);
				}
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: t('Favorites') }),
				});
				return;
			}

			const category = categories.find((current) => current._id === target);
			if (!category) {
				return;
			}
			await persist(
				stripped.map((current) => (current._id === target ? { ...current, rooms: [...(current.rooms ?? []), room.rid] } : current)),
			);
			if (room.isFavorite) {
				await setFavorite(room.rid, false);
			}
			dispatchToastMessage({
				type: 'success',
				message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			});
		},
		[categories, persist, setFavorite, dispatchToastMessage, t],
	);

	/** Create a category and move a room into it in a single persisted action (flow D). */
	const createCategoryAndMoveRoom = useCallback(
		async (name: string, room: MovableRoom, icon?: string) => {
			const category: ISidebarCustomCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: true,
				rooms: [room.rid],
				...(icon ? { icon } : {}),
			};
			await persist([...stripRoom(categories, room.rid), category]);
			if (room.isFavorite) {
				await setFavorite(room.rid, false);
			}
			dispatchToastMessage({
				type: 'success',
				message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			});
		},
		[categories, persist, setFavorite, dispatchToastMessage, t],
	);

	const getRoomCategory = useCallback(
		(rid: string): ISidebarCustomCategory | undefined => categories.find((category) => category.rooms?.includes(rid)),
		[categories],
	);

	/** Remove a room from its current grouping (custom category or Favorites) — it returns to its system group. */
	const removeRoom = useCallback(
		async (room: MovableRoom) => {
			const current = categories.find((category) => category.rooms?.includes(room.rid));
			const fromName = current?.name ?? (room.isFavorite ? t('Favorites') : '');

			await persist(stripRoom(categories, room.rid));
			if (room.isFavorite) {
				await setFavorite(room.rid, false);
			}
			if (fromName) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__removed_from__categoryName__', { roomName: room.name, categoryName: fromName }),
				});
			}
		},
		[categories, persist, setFavorite, dispatchToastMessage, t],
	);

	return useMemo(
		() => ({
			categories,
			validateName,
			createCategory,
			renameCategory,
			deleteCategory,
			reorderCategory,
			toggleShowUnreads,
			moveRoom,
			createCategoryAndMoveRoom,
			removeRoom,
			getRoomCategory,
		}),
		[
			categories,
			validateName,
			createCategory,
			renameCategory,
			deleteCategory,
			reorderCategory,
			toggleShowUnreads,
			moveRoom,
			createCategoryAndMoveRoom,
			removeRoom,
			getRoomCategory,
		],
	);
};
