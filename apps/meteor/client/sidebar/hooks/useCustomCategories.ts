import type { ISidebarCategory } from '@rocket.chat/core-typings';
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

export const FAVORITES_TARGET = 'favorites';

const EMPTY: ISidebarCategory[] = [];

export const useCustomCategories = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');

	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', EMPTY) ?? EMPTY;

	const categories = useMemo(
		() => (hasLicenseModule ? allEntries.filter((entry) => !entry.default) : EMPTY),
		[hasLicenseModule, allEntries],
	);

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const setCategoryEndpoint = useExperimentalEndpoint('POST', '/experimental/rooms.setCategory');
	const toggleFavoriteEndpoint = useEndpoint('POST', '/v1/rooms.favorite');

	const persistMutation = useMutation({
		mutationFn: (next: ISidebarCategory[]) => saveUserPreferences({ data: { sidebarCategories: next } }),
	});

	const persist = useCallback((next: ISidebarCategory[]) => persistMutation.mutateAsync(next), [persistMutation.mutateAsync]);

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

	const createCategory = useCallback(
		async (name: string, roomIds: string[] = []): Promise<ISidebarCategory> => {
			const category: ISidebarCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: false,
			};
			await persist([category, ...allEntries]);
			if (roomIds.length > 0) {
				await setCategory(roomIds, category._id);
			}
			return category;
		},
		[allEntries, persist, setCategory],
	);

	const deleteCategory = useCallback(
		async (categoryId: string, roomIds: string[] = []) => {
			await persist(allEntries.filter((entry) => entry._id !== categoryId));
			if (roomIds.length > 0) {
				await setCategory(roomIds, null);
			}
		},
		[allEntries, persist, setCategory],
	);

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

	const createCategoryAndMoveRoom = useCallback(
		async (name: string, room: MovableRoom, extraRoomIds: string[] = []) => {
			const category: ISidebarCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: false,
			};
			await persist([category, ...allEntries]);
			await setCategory([room.rid, ...extraRoomIds], category._id);
			dispatchToastMessage({
				type: 'success',
				message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			});
		},
		[allEntries, persist, setCategory, dispatchToastMessage, t],
	);

	const updateCategory = useCallback(
		async (categoryId: string, name: string, addedRoomIds: string[], removedRoomIds: string[]) => {
			await persist(allEntries.map((entry) => (entry._id === categoryId ? { ...entry, name: name.trim() } : entry)));
			if (addedRoomIds.length > 0) await setCategory(addedRoomIds, categoryId);
			if (removedRoomIds.length > 0) await setCategory(removedRoomIds, null);
		},
		[allEntries, persist, setCategory],
	);

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

	const isShowUnreads = useCallback((id: string) => allEntries.find((entry) => entry._id === id)?.showUnreads ?? false, [allEntries]);

	const isKeepUnreadsOnTop = useCallback(
		(id: string) => allEntries.find((entry) => entry._id === id)?.keepUnreadsOnTop ?? false,
		[allEntries],
	);

	const upsertGroupEntry = useCallback(
		(id: string, patch: Partial<ISidebarCategory>) => {
			const existing = allEntries.find((entry) => entry._id === id);
			const next = existing
				? allEntries.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry))
				: [...allEntries, { _id: id, name: id, default: true, ...patch }];
			return persist(next);
		},
		[allEntries, persist],
	);

	const toggleShowUnreads = useCallback(
		(id: string) => upsertGroupEntry(id, { showUnreads: !isShowUnreads(id) }),
		[upsertGroupEntry, isShowUnreads],
	);

	const toggleKeepUnreadsOnTop = useCallback(
		(id: string) => upsertGroupEntry(id, { keepUnreadsOnTop: !isKeepUnreadsOnTop(id) }),
		[upsertGroupEntry, isKeepUnreadsOnTop],
	);

	const move = useCallback(
		(currentKeys: string[], key: string, direction: 'up' | 'down') => {
			const i = currentKeys.indexOf(key);
			const target = direction === 'up' ? i - 1 : i + 1;
			if (i === -1 || target < 0 || target >= currentKeys.length) return;
			const entryMap = new Map(allEntries.map((e) => [e._id, e]));
			const visibleEntries: ISidebarCategory[] = currentKeys.map((k) => entryMap.get(k) ?? { _id: k, name: k, default: true });
			const hiddenEntries = allEntries.filter((e) => !currentKeys.includes(e._id));
			const next = [...visibleEntries, ...hiddenEntries];
			[next[i], next[target]] = [next[target], next[i]];
			persist(next);
		},
		[allEntries, persist],
	);

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
			isShowUnreads,
			isKeepUnreadsOnTop,
			move,
		}),
		[
			hasLicenseModule,
			persistMutation.isPending,
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
			isShowUnreads,
			isKeepUnreadsOnTop,
			move,
		],
	);
};
