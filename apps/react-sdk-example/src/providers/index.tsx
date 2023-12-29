import React from 'react';

import UserProvider from './UserProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import SDKProvider from './SDKProvider';
import ServerProvider from './ServerProvider';

export default function Providers({
	serverURL,

	children,
}: {
	serverURL: string;
	children: React.ReactNode;
}) {
	return (
		<SDKProvider serverURL={serverURL}>
			<ConnectionStatusProvider>
				<ServerProvider>
					<UserProvider>{children}</UserProvider>
				</ServerProvider>
			</ConnectionStatusProvider>
		</SDKProvider>
	);
}
