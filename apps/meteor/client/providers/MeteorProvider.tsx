import { ImageGalleryContext, MarkdownTextContext, ModalProvider, TooltipProvider } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import ActionManagerProvider from './ActionManagerProvider';
import AuthenticationProvider from './AuthenticationProvider/AuthenticationProvider';
import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import CustomSoundProvider from './CustomSoundProvider';
import { DeviceProvider } from './DeviceProvider/DeviceProvider';
import EmojiPickerProvider from './EmojiPickerProvider';
import LayoutProvider from './LayoutProvider';
import MediaCallProvider from './MediaCallProvider';
import OmnichannelProvider from './OmnichannelProvider';
import RouterProvider from './RouterProvider';
import ServerProvider from './ServerProvider';
import SessionProvider from './SessionProvider';
import SettingsProvider from './SettingsProvider';
import ToastMessagesProvider from './ToastMessagesProvider';
import TranslationProvider from './TranslationProvider';
import UserPresenceProvider from './UserPresenceProvider';
import UserProvider from './UserProvider';
import VideoConfProvider from './VideoConfProvider';
import LazyImageGallery from '../components/LazyImageGallery';
import MarkdownText from '../components/MarkdownText';
import { OmnichannelRoomIconProvider } from '../components/RoomIcon/OmnichannelRoomIcon/provider/OmnichannelRoomIconProvider';

export type MeteorProviderProps = {
	children?: ReactNode;
};

const MeteorProvider = ({ children }: MeteorProviderProps) => (
	<MarkdownTextContext.Provider value={MarkdownText}>
		<ImageGalleryContext.Provider value={LazyImageGallery}>
			<ServerProvider>
				<RouterProvider>
					<ModalProvider>
						<SettingsProvider>
							<TranslationProvider>
								<SessionProvider>
									<TooltipProvider>
										<ToastMessagesProvider>
											<AvatarUrlProvider>
												<UserProvider>
													<LayoutProvider>
														<AuthenticationProvider>
															<CustomSoundProvider>
																<DeviceProvider>
																	<AuthorizationProvider>
																		<EmojiPickerProvider>
																			<OmnichannelRoomIconProvider>
																				<UserPresenceProvider>
																					<ActionManagerProvider>
																						<VideoConfProvider>
																							<MediaCallProvider>
																								<OmnichannelProvider>{children}</OmnichannelProvider>
																							</MediaCallProvider>
																						</VideoConfProvider>
																					</ActionManagerProvider>
																				</UserPresenceProvider>
																			</OmnichannelRoomIconProvider>
																		</EmojiPickerProvider>
																	</AuthorizationProvider>
																</DeviceProvider>
															</CustomSoundProvider>
														</AuthenticationProvider>
													</LayoutProvider>
												</UserProvider>
											</AvatarUrlProvider>
										</ToastMessagesProvider>
									</TooltipProvider>
								</SessionProvider>
							</TranslationProvider>
						</SettingsProvider>
					</ModalProvider>
				</RouterProvider>
			</ServerProvider>
		</ImageGalleryContext.Provider>
	</MarkdownTextContext.Provider>
);

export default MeteorProvider;
