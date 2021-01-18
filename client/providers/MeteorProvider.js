import React from 'react';

import AttachmentProvider from '../components/Message/Attachments/providers/AttachmentProvider';
import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import LayoutProvider from './LayoutProvider';
import ModalProvider from './ModalProvider';
import OmniChannelProvider from './OmniChannelProvider';
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
									<LayoutProvider>
										<AvatarUrlProvider>
											<CustomSoundProvider>
												<UserProvider>
													<AuthorizationProvider>
														<OmniChannelProvider>
															<ModalProvider>
																{/* TODO move to RoomContext */}
																<AttachmentProvider>
																	{children}
																</AttachmentProvider>
															</ModalProvider>
														</OmniChannelProvider>
													</AuthorizationProvider>
												</UserProvider>
											</CustomSoundProvider>
										</AvatarUrlProvider>
									</LayoutProvider>
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
