import React from 'react';

import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import ModalProvider from './ModalProvider';
import OmniChannelProvider from './OmniChannelProvider';
import ParsersProvider from './ParsersProvider';
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
									<AvatarUrlProvider>
										<CustomSoundProvider>
											<UserProvider>
												<AuthorizationProvider>
													<OmniChannelProvider>
														<ParsersProvider>
															<ModalProvider>
																{children}
															</ModalProvider>
														</ParsersProvider>
													</OmniChannelProvider>
												</AuthorizationProvider>
											</UserProvider>
										</CustomSoundProvider>
									</AvatarUrlProvider>
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
