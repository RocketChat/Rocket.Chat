import React from 'react';

import { ConnectionStatusProvider } from './ConnectionStatusProvider';
import { RouterProvider } from './RouterProvider';
import { SessionProvider } from './SessionProvider';
import { SettingsProvider } from './SettingsProvider';
import { SidebarProvider } from './SidebarProvider';
import { TranslationProvider } from './TranslationProvider';
import { ToastMessagesProvider } from './ToastMessagesProvider';
import { UserProvider } from './UserProvider';

export function MeteorProvider({ children }) {
	return <ConnectionStatusProvider>
		<RouterProvider>
			<TranslationProvider>
				<SessionProvider>
					<SidebarProvider>
						<ToastMessagesProvider>
							<SettingsProvider>
								<UserProvider>
									{children}
								</UserProvider>
							</SettingsProvider>
						</ToastMessagesProvider>
					</SidebarProvider>
				</SessionProvider>
			</TranslationProvider>
		</RouterProvider>
	</ConnectionStatusProvider>;
}
