import type { AccessoryElements, IBlockElement, IImageElement, IInputElement } from './Elements';
import type { ITextObject } from './Objects';

/**
 * The kinds of layout block an App can render.
 *
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export enum BlockType {
	SECTION = 'section',
	DIVIDER = 'divider',
	IMAGE = 'image',
	ACTIONS = 'actions',
	CONTEXT = 'context',
	INPUT = 'input',
	CONDITIONAL = 'conditional',
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IBlock {
	type: BlockType;
	appId?: string;
	blockId?: string;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface ISectionBlock extends IBlock {
	type: BlockType.SECTION;
	text: ITextObject;
	accessory?: AccessoryElements;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IImageBlock extends IBlock {
	type: BlockType.IMAGE;
	imageUrl: string;
	altText: string;
	title?: ITextObject;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IDividerBlock extends IBlock {
	type: BlockType.DIVIDER;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IActionsBlock extends IBlock {
	type: BlockType.ACTIONS;
	elements: Array<IBlockElement>;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IContextBlock extends IBlock {
	type: BlockType.CONTEXT;
	elements: Array<ITextObject | IImageElement>;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IInputBlock extends IBlock {
	type: BlockType.INPUT;
	element: IInputElement;
	label: ITextObject;
	optional?: boolean;
}

/**
 * The clients that can render a block.
 *
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export enum ConditionalBlockFiltersEngine {
	/** The Rocket.Chat clients. */
	ROCKETCHAT = 'rocket.chat',
	/** The Livechat widget. */
	LIVECHAT = 'livechat',
}

/**
 * When an {@link IConditionalBlock} is rendered.
 *
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IConditionalBlockFilters {
	/** The clients that should render the block. Every client does when this is left out. */
	engine?: Array<ConditionalBlockFiltersEngine>;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 *
 * Declares a block that is only visible when a certain
 * condition is met.
 *
 * The content specified in the `render` property will be
 * shown.
 *
 * No condition will be checked by default, i.e. the block
 * will be shown in every case like other blocks.
 *
 * Currently supported conditions:
 *      `engine: Array<"rocket.chat" | "omnichannel">` specifies what engine should
 *      render the block:
 *          "rocket.chat" for regular Rocket.Chat engine
 *          "omnichannel" for the Livechat/Omnichannel widget engine
 *      leave it blank to show the block in both engines
 */

export interface IConditionalBlock extends IBlock {
	type: BlockType.CONDITIONAL;
	when?: IConditionalBlockFilters;
	render: Array<IBlock>;
}
