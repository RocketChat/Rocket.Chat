import React from 'react';

import { ConnectionStatusProvider } from './ConnectionStatusProvider';
import { RouterProvider } from './RouterProvider';
import { SessionProvider } from './SessionProvider';
import { SidebarProvider } from './SidebarProvider';
import { TranslationProvider } from './TranslationProvider';

export function MeteorProvider({ children }) {
	return <ConnectionStatusProvider>
		<RouterProvider>
			<TranslationProvider>
				<SessionProvider>
					<SidebarProvider>
						{children}
					</SidebarProvider>
				</SessionProvider>
			</TranslationProvider>
		</RouterProvider>
	</ConnectionStatusProvider>;
}
