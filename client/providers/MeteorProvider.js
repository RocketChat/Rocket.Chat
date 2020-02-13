import React from 'react';

import { AuthorizationProvider } from './AuthorizationProvider';
import { ConnectionStatusProvider } from './ConnectionStatusProvider';
import { RouterProvider } from './RouterProvider';
import { SessionProvider } from './SessionProvider';
import { SettingsProvider } from './SettingsProvider';
import { ServerProvider } from './ServerProvider';
import { SidebarProvider } from './SidebarProvider';
import { TranslationProvider } from './TranslationProvider';
import { ToastMessagesProvider } from './ToastMessagesProvider';
import { UserProvider } from './UserProvider';

export function MeteorProvider({ children }) {
	return <ConnectionStatusProvider>
		<ServerProvider>
			<RouterProvider>
				<TranslationProvider>
					<SessionProvider>
						<SidebarProvider>
							<ToastMessagesProvider>
								<SettingsProvider>
									<UserProvider>
										<AuthorizationProvider>
											{children}
										</AuthorizationProvider>
									</UserProvider>
								</SettingsProvider>
							</ToastMessagesProvider>
						</SidebarProvider>
					</SessionProvider>
				</TranslationProvider>
			</RouterProvider>
		</ServerProvider>
	</ConnectionStatusProvider>;
}
