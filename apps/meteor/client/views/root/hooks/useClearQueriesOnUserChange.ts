import type { IUser } from '@rocket.chat/core-typings';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

/** Drops every cached query when one user is replaced by another, so nothing fetched for the previous user leaks. */
export const useClearQueriesOnUserChange = (userId: IUser['_id'] | undefined) => {
	const queryClient = useQueryClient();
	const previousUserId = useRef(userId);

	useEffect(() => {
		if (previousUserId.current && previousUserId.current !== userId) {
			queryClient.clear();
		}

		previousUserId.current = userId;
	}, [queryClient, userId]);
};
