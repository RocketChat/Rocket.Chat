import { type ISetting, type Serialized, type SettingValue } from '@rocket.chat/core-typings';
import languages from '@rocket.chat/i18n/dist/languages';
import { type Method, type OperationParams, type OperationResult, type PathPattern, type UrlParams } from '@rocket.chat/rest-typings';
import {
	type ServerMethodName,
	type ServerMethodParameters,
	type ServerMethodReturn,
	type TranslationKey,
	AuthorizationContext,
	ConnectionStatusContext,
	RouterContext,
	ServerContext,
	SettingsContext,
	TranslationContext,
	UserContext,
	ActionManagerContext,
	ModalContext,
} from '@rocket.chat/ui-contexts';
import { type DecoratorFn } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type WrapperComponent } from '@testing-library/react-hooks';
import { createInstance } from 'i18next';
import { type ObjectId } from 'mongodb';
import React, { type ContextType, type ReactNode, useEffect, useReducer } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

export class MockedAppRootBuilder {
	private wrappers: Array<(children: ReactNode) => ReactNode> = [];

	private connectionStatus: ContextType<typeof ConnectionStatusContext> = {
		connected: true,
		status: 'connected',
		retryTime: undefined,
		reconnect: () => undefined,
	};

	private server: ContextType<typeof ServerContext> = {
		absoluteUrl: (path: string) => `http://localhost:3000/${path}`,
		callEndpoint: <TMethod extends Method, TPathPattern extends PathPattern>(_args: {
			method: TMethod;
			pathPattern: TPathPattern;
			keys: UrlParams<TPathPattern>;
			params: OperationParams<TMethod, TPathPattern>;
		}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
			throw new Error('not implemented');
		},
		getStream: () => () => () => undefined,
		uploadToEndpoint: () => Promise.reject(new Error('not implemented')),
		callMethod: () => Promise.reject(new Error('not implemented')),
		info: undefined,
	};

	private router: ContextType<typeof RouterContext> = {
		buildRoutePath: () => '/',
		defineRoutes: () => () => undefined,
		getLocationPathname: () => '/',
		getLocationSearch: () => '',
		getRouteName: () => undefined,
		getRouteParameters: () => ({}),
		getRoutes: () => [],
		getSearchParameters: () => ({}),
		navigate: () => undefined,
		subscribeToRouteChange: () => () => undefined,
		subscribeToRoutesChange: () => () => undefined,
	};

	private settings: Mutable<ContextType<typeof SettingsContext>> = {
		hasPrivateAccess: true,
		isLoading: false,
		querySetting: (_id: string) => [() => () => undefined, () => undefined],
		querySettings: () => [() => () => undefined, () => []],
		dispatch: async () => undefined,
	};

	private user: ContextType<typeof UserContext> = {
		logout: () => Promise.reject(new Error('not implemented')),
		queryPreference: () => [() => () => undefined, () => undefined],
		queryRoom: () => [() => () => undefined, () => undefined],
		querySubscription: () => [() => () => undefined, () => undefined],
		querySubscriptions: () => [() => () => undefined, () => []],
		user: null,
		userId: null,
	};

	private modal: ContextType<typeof ModalContext> = {
		currentModal: { component: null },
		modal: {
			setModal: () => undefined,
		},
	};

	private authorization: ContextType<typeof AuthorizationContext> = {
		queryPermission: () => [() => () => undefined, () => false],
		queryAtLeastOnePermission: () => [() => () => undefined, () => false],
		queryAllPermissions: () => [() => () => undefined, () => false],
		queryRole: () => [() => () => undefined, () => false],
		roleStore: {
			roles: {},
			emit: () => undefined,
			on: () => () => undefined,
			off: () => undefined,
			events: (): Array<'change'> => ['change'],
			has: () => false,
			once: () => () => undefined,
		},
	};

	wrap(wrapper: (children: ReactNode) => ReactNode): this {
		this.wrappers.push(wrapper);
		return this;
	}

	withEndpoint<TMethod extends Method, TPathPattern extends PathPattern>(
		method: TMethod,
		pathPattern: TPathPattern,
		response: (
			params: OperationParams<TMethod, TPathPattern>,
		) => Serialized<OperationResult<TMethod, TPathPattern>> | Promise<Serialized<OperationResult<TMethod, TPathPattern>>>,
	): this {
		const innerFn = this.server.callEndpoint;

		const outerFn = <TMethod extends Method, TPathPattern extends PathPattern>(args: {
			method: TMethod;
			pathPattern: TPathPattern;
			keys: UrlParams<TPathPattern>;
			params: OperationParams<TMethod, TPathPattern>;
		}): Promise<Serialized<OperationResult<TMethod, TPathPattern>>> => {
			if (args.method === String(method) && args.pathPattern === String(pathPattern)) {
				return Promise.resolve(response(args.params)) as Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;
			}

			return innerFn(args);
		};

		this.server.callEndpoint = outerFn;

		return this;
	}

	withMethod<TMethodName extends ServerMethodName>(methodName: TMethodName, response: () => ServerMethodReturn<TMethodName>): this {
		const innerFn = this.server.callMethod;

		const outerFn = <TMethodName extends ServerMethodName>(
			innerMethodName: TMethodName,
			...innerArgs: ServerMethodParameters<TMethodName>
		): Promise<ServerMethodReturn<TMethodName>> => {
			if (innerMethodName === String(methodName)) {
				return Promise.resolve(response()) as Promise<ServerMethodReturn<TMethodName>>;
			}

			if (!innerFn) {
				throw new Error('not implemented');
			}

			return innerFn(innerMethodName, ...innerArgs);
		};

		this.server.callMethod = outerFn;

		return this;
	}

	withPermission(permission: string): this {
		const innerFn = this.authorization.queryPermission;

		const outerFn = (
			innerPermission: string | ObjectId,
			innerScope?: string | ObjectId | undefined,
			innerScopedRoles?: string[] | undefined,
		): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean] => {
			if (innerPermission === permission) {
				return [() => () => undefined, () => true];
			}

			return innerFn(innerPermission, innerScope, innerScopedRoles);
		};

		this.authorization.queryPermission = outerFn;

		const innerFn2 = this.authorization.queryAtLeastOnePermission;

		const outerFn2 = (
			innerPermissions: Array<string | ObjectId>,
			innerScope?: string | ObjectId | undefined,
			innerScopedRoles?: string[] | undefined,
		): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean] => {
			if (innerPermissions.includes(permission)) {
				return [() => () => undefined, () => true];
			}

			return innerFn2(innerPermissions, innerScope, innerScopedRoles);
		};

		this.authorization.queryAtLeastOnePermission = outerFn2;

		const innerFn3 = this.authorization.queryAllPermissions;

		const outerFn3 = (
			innerPermissions: Array<string | ObjectId>,
			innerScope?: string | ObjectId | undefined,
			innerScopedRoles?: string[] | undefined,
		): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean] => {
			if (innerPermissions.includes(permission)) {
				return [() => () => undefined, () => true];
			}

			return innerFn3(innerPermissions, innerScope, innerScopedRoles);
		};

		this.authorization.queryAllPermissions = outerFn3;

		return this;
	}

	withJohnDoe(): this {
		this.user.userId = 'john.doe';

		this.user.user = {
			_id: 'john.doe',
			username: 'john.doe',
			name: 'John Doe',
			createdAt: new Date(),
			active: true,
			_updatedAt: new Date(),
			roles: ['admin'],
			type: 'user',
		};

		return this;
	}

	withAnonymous(): this {
		this.user.userId = null;
		this.user.user = null;

		return this;
	}

	withRole(role: string): this {
		if (!this.user.user) {
			throw new Error('user is not defined');
		}

		this.user.user.roles.push(role);

		const innerFn = this.authorization.queryRole;

		const outerFn = (
			innerRole: string | ObjectId,
			innerScope?: string | undefined,
			innerIgnoreSubscriptions?: boolean | undefined,
		): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => boolean] => {
			if (innerRole === role) {
				return [() => () => undefined, () => true];
			}

			return innerFn(innerRole, innerScope, innerIgnoreSubscriptions);
		};

		this.authorization.queryRole = outerFn;

		return this;
	}

	withSetting(id: string, value: SettingValue): this {
		const setting = {
			_id: id,
			value,
		} as ISetting;

		const innerFn = this.settings.querySetting;

		const outerFn = (
			innerSetting: string,
		): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined] => {
			if (innerSetting === id) {
				return [() => () => undefined, () => setting];
			}

			return innerFn(innerSetting);
		};

		this.settings.querySetting = outerFn;

		return this;
	}

	withUserPreference(id: string | ObjectId, value: unknown): this {
		const innerFn = this.user.queryPreference;

		const outerFn = <T,>(
			key: string | ObjectId,
			defaultValue?: T | undefined,
		): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T | undefined] => {
			if (key === id) {
				return [() => () => undefined, () => value as T];
			}

			return innerFn(key, defaultValue);
		};

		this.user.queryPreference = outerFn;

		return this;
	}

	private i18n = createInstance(
		{
			// debug: true,
			lng: 'en',
			fallbackLng: 'en',
			ns: ['core'],
			nsSeparator: '.',
			partialBundledLanguages: true,
			defaultNS: 'core',
			interpolation: {
				escapeValue: false,
			},
			initImmediate: false,
		},
		() => undefined,
	).use(initReactI18next);

	withTranslations(lng: string, ns: string, resources: Record<string, string>): this {
		const addResources = () => {
			this.i18n.addResources(lng, ns, resources);
			for (const [key, value] of Object.entries(resources)) {
				this.i18n.addResource(lng, ns, key, value);
			}
		};

		if (this.i18n.isInitialized) {
			addResources();
			return this;
		}

		this.i18n.on('initialized', addResources);
		return this;
	}

	build(): WrapperComponent<{ children: ReactNode }> {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		const { connectionStatus, server, router, settings, user, modal, i18n, authorization, wrappers } = this;

		const reduceTranslation = (translation?: ContextType<typeof TranslationContext>): ContextType<typeof TranslationContext> => {
			return {
				...translation,
				language: i18n.isInitialized ? i18n.language : 'en',
				languages: [
					{
						en: 'Default',
						name: i18n.isInitialized ? i18n.t('Default') : 'Default',
						ogName: i18n.isInitialized ? i18n.t('Default') : 'Default',
						key: '',
					},
					...(i18n.isInitialized
						? [...new Set([...i18n.languages, ...languages])].map((key) => ({
								en: key,
								name: new Intl.DisplayNames([key], { type: 'language' }).of(key) ?? key,
								ogName: new Intl.DisplayNames([key], { type: 'language' }).of(key) ?? key,
								key,
						  }))
						: []),
				],
				loadLanguage: async (language) => {
					if (!i18n.isInitialized) {
						return;
					}

					await i18n.changeLanguage(language);
				},
				translate: Object.assign(
					(key: TranslationKey, options?: unknown) => (i18n.isInitialized ? i18n.t(key, options as { lng?: string }) : ''),
					{
						has: (key: string, options?: { lng?: string }): key is TranslationKey =>
							!!key && i18n.isInitialized && i18n.exists(key, options),
					},
				),
			};
		};

		return function MockedAppRoot({ children }) {
			const [translation, updateTranslation] = useReducer(reduceTranslation, undefined, () => reduceTranslation());

			useEffect(() => {
				i18n.on('initialized', updateTranslation);
				i18n.on('languageChanged', updateTranslation);

				return () => {
					i18n.off('initialized', updateTranslation);
					i18n.off('languageChanged', updateTranslation);
				};
			}, []);

			return (
				<QueryClientProvider client={queryClient}>
					<ConnectionStatusContext.Provider value={connectionStatus}>
						<ServerContext.Provider value={server}>
							<RouterContext.Provider value={router}>
								<SettingsContext.Provider value={settings}>
									<I18nextProvider i18n={i18n}>
										<TranslationContext.Provider value={translation}>
											{/* <SessionProvider>
												<TooltipProvider>
														<ToastMessagesProvider>
																<LayoutProvider>
																		<AvatarUrlProvider>
																				<CustomSoundProvider> */}
											<UserContext.Provider value={user}>
												{/* <DeviceProvider>*/}
												<ModalContext.Provider value={modal}>
													<AuthorizationContext.Provider value={authorization}>
														{/* <EmojiPickerProvider>
																<OmnichannelRoomIconProvider>
																		<UserPresenceProvider>*/}
														<ActionManagerContext.Provider
															value={{
																generateTriggerId: () => '',
																emitInteraction: () => Promise.reject(new Error('not implemented')),
																getInteractionPayloadByViewId: () => undefined,
																handleServerInteraction: () => undefined,
																off: () => undefined,
																on: () => undefined,
																openView: () => undefined,
																disposeView: () => undefined,
																notifyBusy: () => undefined,
																notifyIdle: () => undefined,
															}}
														>
															{/* <VideoConfProvider>
																	<CallProvider>
																		<OmnichannelProvider> */}
															{wrappers.reduce((children, wrapper) => wrapper(children), children)}
															{/* 		</OmnichannelProvider>
																	</CallProvider>
																</VideoConfProvider>*/}
														</ActionManagerContext.Provider>
														{/* 		</UserPresenceProvider>
																</OmnichannelRoomIconProvider>
															</EmojiPickerProvider>*/}
													</AuthorizationContext.Provider>
												</ModalContext.Provider>
												{/* </DeviceProvider>*/}
											</UserContext.Provider>
											{/* 					</CustomSoundProvider>
																</AvatarUrlProvider>
															</LayoutProvider>
														</ToastMessagesProvider>
													</TooltipProvider>
												</SessionProvider> */}
										</TranslationContext.Provider>
									</I18nextProvider>
								</SettingsContext.Provider>
							</RouterContext.Provider>
						</ServerContext.Provider>
					</ConnectionStatusContext.Provider>
				</QueryClientProvider>
			);
		};
	}

	buildStoryDecorator(): DecoratorFn {
		const WrapperComponent = this.build();

		// eslint-disable-next-line react/display-name, react/no-multi-comp
		return (fn) => <WrapperComponent>{fn()}</WrapperComponent>;
	}
}
