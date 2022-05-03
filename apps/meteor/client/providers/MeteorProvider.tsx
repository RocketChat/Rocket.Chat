import React, { FC } from 'react';

import AttachmentProvider from '../components/Message/Attachments/providers/AttachmentProvider';
import { DispatchGlobalContext } from '../contexts/BlogDetailContext/GlobalState';
import AuthorizationProvider from './AuthorizationProvider';
import AvatarUrlProvider from './AvatarUrlProvider';
import BlogDetailContextProvider from './BlogDetailProvider';
import GameDetailContextProvider from './GameDetailProvider';
import { CallProvider } from './CallProvider';
import ConnectionStatusProvider from './ConnectionStatusProvider';
import CustomSoundProvider from './CustomSoundProvider';
import LayoutProvider from './LayoutProvider';
import ModalProvider from './ModalProvider';
import OmnichannelProvider from './OmnichannelProvider';
import RouterProvider from './RouterProvider';
import ServerProvider from './ServerProvider';
import SessionProvider from './SessionProvider';
import SettingsProvider from './SettingsProvider';
import SidebarProvider from './SidebarProvider';
import ToastMessagesProvider from './ToastMessagesProvider';
import TooltipProvider from './TooltipProvider';
import TranslationProvider from './TranslationProvider';
import UserProvider from './UserProvider';
import ProductDetailContextProvider from './ProductDetailProvider';

const MeteorProvider: FC = ({ children }) => (
	<ConnectionStatusProvider>
		<ServerProvider>
			<RouterProvider>
				<TranslationProvider>
					<SessionProvider>
						<SidebarProvider>
							<TooltipProvider>
								<ToastMessagesProvider>
									<SettingsProvider>
										<LayoutProvider>
											<AvatarUrlProvider>
												<CustomSoundProvider>
													<UserProvider>
														<AuthorizationProvider>
															<CallProvider>
																<OmnichannelProvider>
																	<ModalProvider>
																		<GameDetailContextProvider>
																			<BlogDetailContextProvider>
																				<ProductDetailContextProvider>
																					<AttachmentProvider>{children}</AttachmentProvider>
																				</ProductDetailContextProvider>
																			</BlogDetailContextProvider>
																		</GameDetailContextProvider>
																	</ModalProvider>
																</OmnichannelProvider>
															</CallProvider>
														</AuthorizationProvider>
													</UserProvider>
												</CustomSoundProvider>
											</AvatarUrlProvider>
										</LayoutProvider>
									</SettingsProvider>
								</ToastMessagesProvider>
							</TooltipProvider>
						</SidebarProvider>
					</SessionProvider>
				</TranslationProvider>
			</RouterProvider>
		</ServerProvider>
	</ConnectionStatusProvider>
);

export default MeteorProvider;
