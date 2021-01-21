declare module '@rocket.chat/fuselage-ui-kit' {
	import { IBlock } from '@rocket.chat/ui-kit';
	import { Context, FC, ReactChildren } from 'react';

	export const kitContext: Context<{
		action: (action: {
			blockId: string;
			appId: string;
			actionId: string;
			value: unknown;
			viewId: string;
		}) => void | Promise<void>;
		state: (state: {
			blockId: string;
			appId: string;
			actionId: string;
			value: unknown;
		}) => void | Promise<void>;
		appId: string;
		errors: {
			[fieldName: string]: string;
		};
	}>;

	type UiKitComponentProps = {
		render: (blocks: IBlock[]) => ReactChildren;
		blocks: IBlock[];
	};
	export const UiKitComponent: FC<UiKitComponentProps>;

	export const UiKitBanner: (blocks: IBlock[], conditions?: { [param: string]: unknown }) => ReactChildren;
	export const UiKitMessage: (blocks: IBlock[], conditions?: { [param: string]: unknown }) => ReactChildren;
	export const UiKitModal: (blocks: IBlock[], conditions?: { [param: string]: unknown }) => ReactChildren;
}
