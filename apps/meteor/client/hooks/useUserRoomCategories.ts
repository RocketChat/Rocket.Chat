import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useUserRoomCategories = () => {
	const userId = useUserId();
	const queryClient = useQueryClient();
	const getCategoriesEndpoint = useEndpoint('GET', '/v1/user-room-categories');
	const createCategoryEndpoint = useEndpoint('POST', '/v1/user-room-categories');
	const addRoomEndpoint = useEndpoint('POST', '/v1/user-room-categories/add-room');
	const removeRoomEndpoint = useEndpoint('POST', '/v1/user-room-categories/remove-room');
	const removeCategoryEndpoint = useEndpoint('POST', '/v1/user-room-categories/remove-category');

	const queryKey = ['userRoomCategories', userId];

	const query = useQuery({
		queryKey,
		queryFn: async () => {
			try {
				const data = await getCategoriesEndpoint();
				return data.categories ?? [];
			} catch {
				return [];
			}
		},
		enabled: !!userId,
	});

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey });
	};

	const addCategoryMutation = useMutation({
		mutationFn: async (name: string) => {
			await createCategoryEndpoint({ name });
		},
		onSuccess: invalidate,
	});

	const addRoomMutation = useMutation({
		mutationFn: async ({ categoryName, roomId }: { categoryName: string; roomId: string }) => {
			await addRoomEndpoint({ categoryName, roomId });
		},
		onSuccess: invalidate,
	});

	const addCategory = async (name: string) => addCategoryMutation.mutateAsync(name);
	const addRoomToCategory = async (categoryName: string, roomId: string) => addRoomMutation.mutateAsync({ categoryName, roomId });

	const removeRoomMutation = useMutation({
		mutationFn: async ({ categoryName, roomId }: { categoryName: string; roomId: string }) => {
			await removeRoomEndpoint({ categoryName, roomId });
		},
		onSuccess: invalidate,
	});

	const removeCategoryMutation = useMutation({
		mutationFn: async (name: string) => {
			await removeCategoryEndpoint({ name });
		},
		onSuccess: invalidate,
	});

	const removeRoomFromCategory = async (categoryName: string, roomId: string) =>
		removeRoomMutation.mutateAsync({ categoryName, roomId });

	const removeCategory = async (name: string) => removeCategoryMutation.mutateAsync(name);

	useEffect(() => {
		(globalThis as Record<string, unknown>).__sidebarCustomCategories = {
			addCategory,
			addRoomToCategory,
			removeRoomFromCategory,
			removeCategory,
			refresh: query.refetch,
			getCategories: () => query.data ?? [],
		};

		return () => {
			delete (globalThis as Record<string, unknown>).__sidebarCustomCategories;
		};
	}, [addCategory, addRoomToCategory, removeRoomFromCategory, removeCategory, query.refetch, query.data]);

	return {
		...query,
		addCategory,
		addRoomToCategory,
		removeRoomFromCategory,
		removeCategory,
	};
};
