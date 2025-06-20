import { AuthorizationContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';

const dummyRolesMap: ReturnType<ContextType<typeof AuthorizationContext>['getRoles']> = new Map();

export const MockedAuthorizationContext = ({
	permissions = [],
	roles = [],
	children,
}: {
	permissions: string[];
	roles?: string[];
	children: ReactNode;
}) => {
	return (
		<AuthorizationContext.Provider
			value={{
				queryPermission: (id: string) => [() => (): void => undefined, (): boolean => permissions.includes(id)],
				queryAtLeastOnePermission: (ids: string[]) => [
					() => (): void => undefined,
					(): boolean => ids.some((id) => permissions.includes(id)),
				],
				queryAllPermissions: (ids: string[]) => [() => (): void => undefined, (): boolean => ids.every((id) => permissions.includes(id))],
				queryRole: (id: string) => [() => (): void => undefined, (): boolean => roles.includes(id)],
				getRoles: () => dummyRolesMap,
				subscribeToRoles: (): (() => void) => (): void => undefined,
			}}
		>
			{children}
		</AuthorizationContext.Provider>
	);
};
