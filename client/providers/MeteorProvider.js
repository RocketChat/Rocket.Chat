import React from 'react';

import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import ModalProvider from './ModalProvider';
import RouterProvider from './RouterProvider';
import ServerProvider from './ServerProvider';
import SessionProvider from './SessionProvider';
import SettingsProvider from './SettingsProvider';
import SidebarProvider from './SidebarProvider';
import ToastMessagesProvider from './ToastMessagesProvider';
import TranslationProvider from './TranslationProvider';
import UserProvider from './UserProvider';

function MeteorProvider({ children }) {
	return <ConnectionStatusProvider>
		<ServerProvider>
			<RouterProvider>
				<TranslationProvider>
					<SessionProvider>
						<SidebarProvider>
							<ToastMessagesProvider>
								<SettingsProvider>
									<CustomSoundProvider>
										<AvatarUrlProvider>
											<UserProvider>
												<AuthorizationProvider>
													<ModalProvider>
														{children}
													</ModalProvider>
												</AuthorizationProvider>
											</UserProvider>
										</AvatarUrlProvider>
									</CustomSoundProvider>
								</SettingsProvider>
							</ToastMessagesProvider>
						</SidebarProvider>
					</SessionProvider>
				</TranslationProvider>
			</RouterProvider>
		</ServerProvider>
	</ConnectionStatusProvider>;
}

export default MeteorProvider;
