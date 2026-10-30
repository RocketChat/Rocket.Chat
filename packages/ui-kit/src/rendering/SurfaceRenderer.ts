import { BlockContext } from './BlockContext.js';
import type { BlockRenderers } from './BlockRenderers.js';
import type { Conditions } from './Conditions.js';
import { renderBlockElement } from './renderBlockElement.js';
import { renderLayoutBlock } from './renderLayoutBlock.js';
import { renderTextObject } from './renderTextObject.js';
import { resolveConditionalBlocks } from './resolveConditionalBlocks.js';
import type { Block } from '../blocks/Block.js';
import type { BlockElement } from '../blocks/BlockElement.js';
import { LayoutBlockType } from '../blocks/LayoutBlockType.js';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock.js';
import type { TextObject } from '../blocks/TextObject.js';
import { isActionsBlockElement } from '../blocks/isActionsBlockElement.js';
import { isContextBlockElement } from '../blocks/isContextBlockElement.js';
import { isInputBlockElement } from '../blocks/isInputBlockElement.js';
import { isSectionBlockAccessoryElement } from '../blocks/isSectionBlockAccessoryElement.js';
import { isTextObject } from '../blocks/isTextObject.js';
import type { Markdown } from '../blocks/text/Markdown.js';
import type { PlainText } from '../blocks/text/PlainText.js';

export abstract class SurfaceRenderer<
	TOutputObject,
	TAllowedLayoutBlock extends RenderableLayoutBlock = RenderableLayoutBlock,
> implements BlockRenderers<TOutputObject> {
	protected readonly allowedLayoutBlockTypes: Set<TAllowedLayoutBlock['type']>;

	public constructor(allowedLayoutBlockTypes: readonly TAllowedLayoutBlock['type'][]) {
		this.allowedLayoutBlockTypes = new Set(allowedLayoutBlockTypes);
	}

	private isAllowedLayoutBlock = (block: Block): block is TAllowedLayoutBlock =>
		this.allowedLayoutBlockTypes.has(block.type as TAllowedLayoutBlock['type']);

	public render(blocks: readonly Block[], conditions?: Conditions): TOutputObject[] {
		if (!Array.isArray(blocks)) {
			return [];
		}

		return blocks
			.flatMap(resolveConditionalBlocks(conditions))
			.filter(this.isAllowedLayoutBlock)
			.map(renderLayoutBlock(this))
			.filter((value): value is TOutputObject => value !== null);
	}

	public renderTextObject(textObject: TextObject, index: number, context: BlockContext = BlockContext.NONE): TOutputObject | null {
		return renderTextObject(this, context)(textObject, index);
	}

	public renderActionsBlockElement(block: BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.ACTIONS) === false && !isActionsBlockElement(block)) {
			return null;
		}

		return renderBlockElement(this, BlockContext.ACTION)(block, index);
	}

	public renderContextBlockElement(block: TextObject | BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.CONTEXT) === false && !isContextBlockElement(block)) {
			return null;
		}

		if (isTextObject(block)) {
			return renderTextObject(this, BlockContext.CONTEXT)(block, index);
		}

		return renderBlockElement(this, BlockContext.CONTEXT)(block, index);
	}

	public renderInputBlockElement(block: BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.INPUT) === false && !isInputBlockElement(block)) {
			return null;
		}

		return renderBlockElement(this, BlockContext.FORM)(block, index);
	}

	public renderSectionAccessoryBlockElement(block: BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.SECTION) === false && !isSectionBlockAccessoryElement(block)) {
			return null;
		}

		return renderBlockElement(this, BlockContext.SECTION)(block, index);
	}

	public abstract plain_text(textObject: PlainText, context: BlockContext, index: number): TOutputObject | null;

	public abstract mrkdwn(textObject: Markdown, context: BlockContext, index: number): TOutputObject | null;
}
