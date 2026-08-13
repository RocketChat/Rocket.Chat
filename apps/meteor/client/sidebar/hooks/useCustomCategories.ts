import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useEndpoint, useToastMessageDispatch, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsEnterprise } from '../../hooks/useIsEnterprise';
import { toggleFavoriteRoom } from '../../lib/mutationEffects/room';

export const MAX_CATEGORY_NAME_LENGTH = 30;

export type CategoryNameError = 'empty' | 'duplicate';

export type MovableRoom = { rid: string; name?: string; isFavorite?: boolean };

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
	const { data: enterpriseData } = useIsEnterprise();
	const isEnterprise = Boolean(enterpriseData?.isEnterprise);
	const rawCategories = useUserPreference<ISidebarCustomCategory[]>('sidebarCustomCategories', EMPTY) ?? EMPTY;
	const categories = isEnterprise ? rawCategories : EMPTY;

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

	/** Create a category, optionally pre-populated with room IDs. Strips each room from any prior category. */
	const createCategory = useCallback(
		async (name: string, rooms: string[] = []): Promise<ISidebarCustomCategory> => {
			const stripped = rooms.reduce((cats, rid) => stripRoom(cats, rid), categories);
			const category: ISidebarCustomCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: true,
				rooms,
			};
			await persist([category, ...stripped]);
			await Promise.allSettled(rooms.map((rid) => setFavorite(rid, false)));
			return category;
		},
		[categories, persist, setFavorite],
	);

	const deleteCategory = useCallback(
		(categoryId: string) => persist(categories.filter((category) => category._id !== categoryId)),
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

	const toggleKeepUnreadsOnTop = useCallback(
		(categoryId: string) =>
			persist(
				categories.map((category) =>
					category._id === categoryId ? { ...category, keepUnreadsOnTop: !category.keepUnreadsOnTop } : category,
				),
			),
		[categories, persist],
	);

	/** Move a room into a custom category (by id) or to Favorites. Assignment is exclusive. */
	const moveRoom = useCallback(
		async (room: MovableRoom, target: string, { silent = false }: { silent?: boolean } = {}) => {
			const stripped = stripRoom(categories, room.rid);

			if (target === FAVORITES_TARGET) {
				await persist(stripped);
				if (!room.isFavorite) {
					try {
						await setFavorite(room.rid, true);
					} catch (e) {
						await persist(categories);
						throw e;
					}
				}
				if (!silent && room.name) {
					dispatchToastMessage({
						type: 'success',
						message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: t('Favorites') }),
					});
				}
				return;
			}

			const category = categories.find((current) => current._id === target);
			if (!category) {
				return;
			}
			const next = stripped.map((current) =>
				current._id === target ? { ...current, rooms: [...(current.rooms ?? []), room.rid] } : current,
			);
			await persist(next);
			if (room.isFavorite) {
				try {
					await setFavorite(room.rid, false);
				} catch (e) {
					await persist(categories);
					throw e;
				}
			}
			if (!silent && room.name) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
				});
			}
		},
		[categories, persist, setFavorite, dispatchToastMessage, t],
	);

	/** Create a category, move a room into it (with full move semantics), and optionally add more rooms. */
	const createCategoryAndMoveRoom = useCallback(
		async (name: string, room: MovableRoom, extraRooms: string[] = []) => {
			const allRooms = [room.rid, ...extraRooms];
			const stripped = allRooms.reduce((cats, rid) => stripRoom(cats, rid), categories);
			const category: ISidebarCustomCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: true,
				rooms: allRooms,
			};
			await persist([category, ...stripped]);
			if (room.isFavorite) {
				try {
					await setFavorite(room.rid, false);
				} catch (e) {
					await persist(categories);
					throw e;
				}
			}
			await Promise.allSettled(extraRooms.map((rid) => setFavorite(rid, false)));
			dispatchToastMessage({
				type: 'success',
				message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			});
		},
		[categories, persist, setFavorite, dispatchToastMessage, t],
	);

	/** Update a category's name and room list in a single persist. Strips added rooms from any prior category. */
	const updateCategory = useCallback(
		async (categoryId: string, name: string, rooms: string[]) => {
			const previous = categories.find((cat) => cat._id === categoryId);
			const previousRooms = new Set(previous?.rooms ?? []);
			const newlyAdded = rooms.filter((rid) => !previousRooms.has(rid));

			const stripped = rooms.reduce((cats, rid) => stripRoom(cats, rid), categories);
			await persist(stripped.map((category) => (category._id === categoryId ? { ...category, name: name.trim(), rooms } : category)));

			// Unfavorite newly added rooms — mirrors moveRoom semantics.
			await Promise.allSettled(newlyAdded.map((rid) => setFavorite(rid, false)));
		},
		[categories, persist, setFavorite],
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
				try {
					await setFavorite(room.rid, false);
				} catch (e) {
					await persist(categories);
					throw e;
				}
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
			isEnterprise,
			categories,
			validateName,
			createCategory,
			createCategoryAndMoveRoom,
			updateCategory,
			deleteCategory,
			toggleShowUnreads,
			toggleKeepUnreadsOnTop,
			moveRoom,
			removeRoom,
			getRoomCategory,
		}),
		[
			isEnterprise,
			categories,
			validateName,
			createCategory,
			updateCategory,
			deleteCategory,
			toggleShowUnreads,
			toggleKeepUnreadsOnTop,
			moveRoom,
			createCategoryAndMoveRoom,
			removeRoom,
			getRoomCategory,
		],
	);
};
