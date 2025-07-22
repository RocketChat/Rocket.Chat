import { ModalProvider } from '@rocket.chat/ui-client';
import { VoipProvider } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';

import ActionManagerProvider from './ActionManagerProvider';
import AuthenticationProvider from './AuthenticationProvider/AuthenticationProvider';
import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import { DeviceProvider } from './DeviceProvider/DeviceProvider';
import EmojiPickerProvider from './EmojiPickerProvider';
import LayoutProvider from './LayoutProvider';
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

type MeteorProviderProps = {
	children?: ReactNode;
};

const MeteorProvider = ({ children }: MeteorProviderProps) => (
	<ConnectionStatusProvider>
		<ServerProvider>
			<RouterProvider>
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
															<ModalProvider>
																<AuthorizationProvider>
																	<EmojiPickerProvider>
																		<UserPresenceProvider>
																			<ActionManagerProvider>
																				<VideoConfProvider>
																					<VoipProvider>{children}</VoipProvider>
																				</VideoConfProvider>
																			</ActionManagerProvider>
																		</UserPresenceProvider>
																	</EmojiPickerProvider>
																</AuthorizationProvider>
															</ModalProvider>
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
			</RouterProvider>
		</ServerProvider>
	</ConnectionStatusProvider>
);

export default MeteorProvider;
