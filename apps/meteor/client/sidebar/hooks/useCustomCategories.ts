import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useEndpoint, useToastMessageDispatch, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SYSTEM_GROUP_KEYS } from './useRoomList';
import { useExperimentalEndpoint } from '../../hooks/useExperimentalEndpoint';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

export const MAX_CATEGORY_NAME_LENGTH = 30;

export type MovableRoom = { rid: string; name?: string; isFavorite?: boolean; categoryId?: string };

/** The `favorites` sentinel is mutually exclusive with the custom categories. */
export const FAVORITES_TARGET = 'favorites';

const EMPTY: ISidebarCustomCategory[] = [];

/**
 * Per-user custom sidebar categories, persisted in the `sidebarCustomCategories` user preference.
 * Room assignment is managed via POST /experimental/rooms.setCategory, which stores `category`
 * on each subscription and handles unfavoriting atomically server-side.
 */
export const useCustomCategories = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');
	const rawCategories = useUserPreference<ISidebarCustomCategory[]>('sidebarCustomCategories', EMPTY) ?? EMPTY;
	const categories = hasLicenseModule ? rawCategories : EMPTY;

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const setCategoryEndpoint = useExperimentalEndpoint('POST', '/experimental/rooms.setCategory');
	const toggleFavoriteEndpoint = useEndpoint('POST', '/v1/rooms.favorite');

	const persistMutation = useMutation({
		mutationFn: (next: ISidebarCustomCategory[]) => saveUserPreferences({ data: { sidebarCustomCategories: next } }),
	});
	const persist = useCallback((next: ISidebarCustomCategory[]) => persistMutation.mutateAsync(next), [persistMutation.mutateAsync]);

	/** Assign a batch of rooms to a category (or null to return them to their system group). */
	const setCategory = useCallback(
		(roomIds: string[], category: string | null) => setCategoryEndpoint({ roomIds, category }),
		[setCategoryEndpoint],
	);

	const validateName = useCallback(
		(name: string, excludeId?: string): string | undefined => {
			const trimmed = name.trim();
			if (!trimmed) {
				return t('Please_enter_a_category_name');
			}
			if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
				return t('Category_name_is_too_long__max__maxLength__characters', { maxLength: MAX_CATEGORY_NAME_LENGTH });
			}
			const normalized = trimmed.toLowerCase();
			if (SYSTEM_GROUP_KEYS.some((key) => t(key).toLowerCase() === normalized)) {
				return t('Category_name_conflicts_with_system_group');
			}
			if (categories.some((category) => category._id !== excludeId && category.name.trim().toLowerCase() === normalized)) {
				return t('A_category_with_this_name_already_exists');
			}
			return undefined;
		},
		[categories, t],
	);

	/** Create a category and optionally assign rooms to it. */
	const createCategory = useCallback(
		async (name: string, roomIds: string[] = []): Promise<ISidebarCustomCategory> => {
			const category: ISidebarCustomCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: false,
			};
			await persist([category, ...categories]);
			if (roomIds.length > 0) {
				await setCategory(roomIds, category._id);
			}
			return category;
		},
		[categories, persist, setCategory],
	);

	const deleteCategory = useCallback(
		(categoryId: string) => persist(categories.filter((category) => category._id !== categoryId)),
		[categories, persist],
	);

	const toggleShowUnreads = useCallback(
		(categoryId: string) =>
			persist(categories.map((category) => (category._id === categoryId ? { ...category, showUnreads: !category.showUnreads } : category))),
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
			if (target === FAVORITES_TARGET) {
				await toggleFavoriteEndpoint({ roomId: room.rid, favorite: true });
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

			await setCategory([room.rid], target);

			if (!silent && room.name) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
				});
			}
		},
		[categories, setCategory, toggleFavoriteEndpoint, dispatchToastMessage, t],
	);

	/** Create a category, move a room into it (with full move semantics), and optionally assign more rooms. */
	const createCategoryAndMoveRoom = useCallback(
		async (name: string, room: MovableRoom, extraRoomIds: string[] = []) => {
			const category: ISidebarCustomCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: false,
			};
			await persist([category, ...categories]);
			await setCategory([room.rid, ...extraRoomIds], category._id);
			dispatchToastMessage({
				type: 'success',
				message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			});
		},
		[categories, persist, setCategory, dispatchToastMessage, t],
	);

	/** Update a category's name and room assignment.
	 * Pass the diff: addedRoomIds for rooms newly assigned to the category,
	 * removedRoomIds for rooms no longer in it (they return to their system group). */
	const updateCategory = useCallback(
		async (categoryId: string, name: string, addedRoomIds: string[], removedRoomIds: string[]) => {
			await persist(categories.map((category) => (category._id === categoryId ? { ...category, name: name.trim() } : category)));
			if (addedRoomIds.length > 0) await setCategory(addedRoomIds, categoryId);
			if (removedRoomIds.length > 0) await setCategory(removedRoomIds, null);
		},
		[categories, persist, setCategory],
	);

	/** Remove a room from its current grouping (custom category or Favorites) — it returns to its system group. */
	const removeRoom = useCallback(
		async (room: MovableRoom) => {
			if (room.isFavorite) {
				await toggleFavoriteEndpoint({ roomId: room.rid, favorite: false });
			} else {
				await setCategory([room.rid], null);
			}
			if (room.name) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__removed_from_category', { roomName: room.name }),
				});
			}
		},
		[setCategory, toggleFavoriteEndpoint, dispatchToastMessage, t],
	);

	/** Look up which category a room is in. With subscription-based storage, read from sub.category directly. */
	const getRoomCategory = useCallback((_rid: string): ISidebarCustomCategory | undefined => undefined, []);

	return useMemo(
		() => ({
			hasLicenseModule,
			isPersisting: persistMutation.isPending,
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
			hasLicenseModule,
			persistMutation.isPending,
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
