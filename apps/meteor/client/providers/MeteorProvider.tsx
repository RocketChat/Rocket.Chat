import { ImageGalleryContext, MarkdownTextContext, ModalProvider, TooltipProvider } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import ActionManagerProvider from './ActionManagerProvider';
import AuthenticationProvider from './AuthenticationProvider/AuthenticationProvider';
import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import { DeviceProvider } from './DeviceProvider/DeviceProvider';
import EmbeddingProvider from './EmbeddingProvider';
import EmojiPickerProvider from './EmojiPickerProvider';
import LayoutProvider from './LayoutProvider';
import MediaCallProvider from './MediaCallProvider';
import NotificationSoundsProvider from './NotificationSoundsProvider';
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
	<ServerProvider>
		<MarkdownTextContext.Provider value={MarkdownText}>
			<ImageGalleryContext.Provider value={LazyImageGallery}>
				<RouterProvider>
					<ModalProvider>
						<SettingsProvider>
							<EmbeddingProvider>
								<TranslationProvider>
									<SessionProvider>
										<TooltipProvider>
											<ToastMessagesProvider>
												<AvatarUrlProvider>
													<ConnectionStatusProvider>
														<UserProvider>
															<LayoutProvider>
																<AuthenticationProvider>
																	<CustomSoundProvider>
																		<NotificationSoundsProvider>
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
																		</NotificationSoundsProvider>
																	</CustomSoundProvider>
																</AuthenticationProvider>
															</LayoutProvider>
														</UserProvider>
													</ConnectionStatusProvider>
												</AvatarUrlProvider>
											</ToastMessagesProvider>
										</TooltipProvider>
									</SessionProvider>
								</TranslationProvider>
							</EmbeddingProvider>
						</SettingsProvider>
					</ModalProvider>
				</RouterProvider>
			</ImageGalleryContext.Provider>
		</MarkdownTextContext.Provider>
	</ServerProvider>
);

export default MeteorProvider;
