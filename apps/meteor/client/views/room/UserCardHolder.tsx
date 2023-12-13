import type { ComponentProps } from 'react';
import React, { Suspense, lazy } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

const UserCard = lazy(() => import('./UserCard'));

type UserCardHolderProps = {
	getProps: () => ComponentProps<typeof UserCard>;
	subscribeToProps: (callback: () => void) => () => void;
};

function UserCardHolder({ getProps, subscribeToProps }: UserCardHolderProps) {
	const props = useSyncExternalStore(subscribeToProps, getProps);

	return (
		<Suspense fallback={null}>
			<UserCard {...props} />
		</Suspense>
	);
}

export default UserCardHolder;
