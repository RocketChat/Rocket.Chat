import type { ComponentType } from 'preact';

export {};

declare global {
	interface Window {
		SERVER_URL: string;
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
