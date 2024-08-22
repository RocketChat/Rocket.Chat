import type { ComponentType } from 'preact';

export {};

declare global {
	interface Window {
		SERVER_URL: string;
		handleIframeClose?: () => void;
		expandCall?: () => void;
		RocketChat: {
			// TODO: Discover what the hell does "_" do
			_: any;
			url?: string;
			// TODO: Type this
			livechat: {
				pageVisited;
				setCustomField;
				initialize;
				setTheme;
				setDepartment;
				clearDepartment;
				setGuestToken;
				setGuestName;
				setGuestEmail;
				setAgent;
				registerGuest;
				setLanguage;
				showWidget;
				hideWidget;
				maximizeWidget;
				minimizeWidget;
				setBusinessUnit;
				clearBusinessUnit;
				setParentUrl;

				// callbacks
				onChatMaximized;
				onChatMinimized;
				onChatStarted;
				onChatEnded;
				onPrechatFormSubmit;
				onOfflineFormSubmit;
				onWidgetShown;
				onWidgetHidden;
				onAssignAgent;
				onAgentStatusChange;
				onQueuePositionChange;
				onServiceOffline;
			};
		};
		initRocket?: string[];
	}

	interface Document {
		msHidden?: Document['hidden'];
		webkitHidden?: Document['hidden'];
		parentWindow?: Window;
		selection?: Selection;
	}

	interface Selection {
		createRange?: () => Range;
	}

	interface HTMLElement {
		document?: Document;
		createTextRange?: () => Range;
	}

	interface Range {
		moveToElementText?: (el: HTMLElement) => void;
		setEndPoint?: (type: string, endRange: Range) => void;
		text?: string;
	}

	namespace preact {
		interface Component {
			// This is a workaround for https://github.com/preactjs/preact/issues/1206
			refs: Record<string, any>;
		}

		interface Provider<P> {
			$$typeof: symbol;
			props: P & { children?: ComponentChildren };
		}

		interface Consumer {
			$$typeof: symbol;
		}
	}
}

declare module '@storybook/preact/dist/ts3.9/client/preview/types-6-0.d.ts' {
	export type PreactFramework = {
		component: ComponentType<any, any>;
		storyResult: StoryFnPreactReturnType;
	};
}

declare module 'react-i18next' {
	import type { ComponentType, ComponentProps } from 'preact';

	export function withTranslation<N extends Namespace = DefaultNamespace, TKPrefix extends KeyPrefix<N> = undefined>(
		ns?: N,
		options?: {
			withRef?: boolean;
			keyPrefix?: TKPrefix;
		},
	): <
		C extends ComponentType<ComponentProps<any> & WithTranslationProps>,
		ResolvedProps = JSX.LibraryManagedAttributes<C, Subtract<ComponentProps<C>, WithTranslationProps>>,
	>(
		component: C,
	) => ComponentType<Omit<ResolvedProps, keyof WithTranslation<N>> & WithTranslationProps>;
}
