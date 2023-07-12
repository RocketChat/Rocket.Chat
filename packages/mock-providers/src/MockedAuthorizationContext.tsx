import React from 'react';
import { AuthorizationContext } from '@rocket.chat/ui-contexts';

export const MockedAuthorizationContext = ({ permissions = [], children }: { permissions: string[]; children: React.ReactNode }) => {
	return (
		<AuthorizationContext.Provider
			value={{
				queryPermission: (id: string) => [() => (): void => undefined, (): boolean => permissions.includes(id)],
				queryAtLeastOnePermission: () => [() => (): void => undefined, (): boolean => false],
				queryAllPermissions: () => [() => (): void => undefined, (): boolean => false],
				queryRole: () => [() => (): void => undefined, (): boolean => false],
				roleStore: {
					roles: {},
					emit: (): void => undefined,
					on: () => (): void => undefined,
					off: (): void => undefined,
					events: (): 'change'[] => ['change'],
					has: (): boolean => false,
					once: () => (): void => undefined,
				},
			}}
		>
			{children}
		</AuthorizationContext.Provider>
	);
};
