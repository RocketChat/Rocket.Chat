import React from 'react';

import { ConnectionStatusProvider } from './ConnectionStatusProvider';
import { RouterProvider } from './RouterProvider';
import { SessionProvider } from './SessionProvider';
import { TranslationProvider } from './TranslationProvider';

export function MeteorProvider({ children }) {
	return <ConnectionStatusProvider>
		<RouterProvider>
			<TranslationProvider>
				<SessionProvider>
					{children}
				</SessionProvider>
			</TranslationProvider>
		</RouterProvider>
	</ConnectionStatusProvider>;
}
