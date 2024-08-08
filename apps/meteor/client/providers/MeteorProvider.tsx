import type { FC } from 'react';
import React from 'react';

import { OmnichannelRoomIconProvider } from '../components/RoomIcon/OmnichannelRoomIcon/provider/OmnichannelRoomIconProvider';
import ActionManagerProvider from './ActionManagerProvider';
import AuthenticationProvider from './AuthenticationProvider/AuthenticationProvider';
import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import { DeviceProvider } from './DeviceProvider/DeviceProvider';
import EmojiPickerProvider from './EmojiPickerProvider';
import LayoutProvider from './LayoutProvider';
import ModalProvider from './ModalProvider/ModalProvider';
import OmnichannelCallProvider from './OmnichannelCallProvider';
import OmnichannelProvider from './OmnichannelProvider';
import RouterProvider from './RouterProvider';
import ServerProvider from './ServerProvider';
import SessionProvider from './SessionProvider';
import SettingsProvider from './SettingsProvider';
import ToastMessagesProvider from './ToastMessagesProvider';
import TooltipProvider from './TooltipProvider';
import TranslationProvider from './TranslationProvider';
import UserPresenceProvider from './UserPresenceProvider';
import UserProvider from './UserProvider';
import VideoConfProvider from './VideoConfProvider';
import VoiceCallProvider from './VoiceCallProvider';

const MeteorProvider: FC = ({ children }) => (
	<ConnectionStatusProvider>
		<ServerProvider>
			<RouterProvider>
				<SettingsProvider>
					<TranslationProvider>
						<SessionProvider>
							<TooltipProvider>
								<ToastMessagesProvider>
									<LayoutProvider>
										<AvatarUrlProvider>
											<UserProvider>
												<AuthenticationProvider>
													<CustomSoundProvider>
														<DeviceProvider>
															<ModalProvider>
																<AuthorizationProvider>
																	<EmojiPickerProvider>
																		<OmnichannelRoomIconProvider>
																			<UserPresenceProvider>
																				<ActionManagerProvider>
																					<VideoConfProvider>
																						<VoiceCallProvider>
																							<OmnichannelCallProvider>
																								<OmnichannelProvider>{children}</OmnichannelProvider>
																							</OmnichannelCallProvider>
																						</VoiceCallProvider>
																					</VideoConfProvider>
																				</ActionManagerProvider>
																			</UserPresenceProvider>
																		</OmnichannelRoomIconProvider>
																	</EmojiPickerProvider>
																</AuthorizationProvider>
															</ModalProvider>
														</DeviceProvider>
													</CustomSoundProvider>
												</AuthenticationProvider>
											</UserProvider>
										</AvatarUrlProvider>
									</LayoutProvider>
								</ToastMessagesProvider>
							</TooltipProvider>
						</SessionProvider>
					</TranslationProvider>
				</SettingsProvider>
			</RouterProvider>
		</ServerProvider>
	</ConnectionStatusProvider>
);

export default MeteorProvider;
