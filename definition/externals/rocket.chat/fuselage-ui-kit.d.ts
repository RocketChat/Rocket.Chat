declare module '@rocket.chat/fuselage-ui-kit' {
	import {
		IDividerBlock,
		ISectionBlock,
		IActionsBlock,
		IContextBlock,
		IInputBlock,
	} from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';
	import { IBlock } from '@rocket.chat/ui-kit';
	import { Context, FC, ReactChildren } from 'react';

	export const kitContext: Context<{
		action: (action: { blockId: string; appId: string; actionId: string; value: unknown; viewId: string }) => void | Promise<void>;
		state?: (state: { blockId: string; appId: string; actionId: string; value: unknown }) => void | Promise<void>;
		appId: string;
		errors?: {
			[fieldName: string]: string;
		};
	}>;

	type UiKitComponentProps = {
		render: (blocks: IBlock[]) => ReactChildren;
		blocks: IBlock[];
	};
	export const UiKitComponent: FC<UiKitComponentProps>;

	type BannerBlocks = IDividerBlock | ISectionBlock | IActionsBlock | IContextBlock | IInputBlock;

	export const UiKitBanner: (blocks: BannerBlocks[], conditions?: { [param: string]: unknown }) => ReactChildren;
	export const UiKitMessage: (blocks: IBlock[], conditions?: { [param: string]: unknown }) => ReactChildren;
	export const UiKitModal: (blocks: IBlock[], conditions?: { [param: string]: unknown }) => ReactChildren;
}
