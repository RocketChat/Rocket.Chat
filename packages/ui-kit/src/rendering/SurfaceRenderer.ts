import type { Block } from '../blocks/Block';
import type { BlockElement } from '../blocks/BlockElement';
import { LayoutBlockType } from '../blocks/LayoutBlockType';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock';
import type { TextObject } from '../blocks/TextObject';
import { TextObjectType } from '../blocks/TextObjectType';
import { isActionsBlockElement } from '../blocks/isActionsBlockElement';
import { isContextBlockElement } from '../blocks/isContextBlockElement';
import { isInputBlockElement } from '../blocks/isInputBlockElement';
import { isSectionBlockAccessoryElement } from '../blocks/isSectionBlockAccessoryElement';
import { isTextObject } from '../blocks/isTextObject';
import type { ActionsBlock } from '../blocks/layout/ActionsBlock';
import type { ContextBlock } from '../blocks/layout/ContextBlock';
import type { InputBlock } from '../blocks/layout/InputBlock';
import type { SectionBlock } from '../blocks/layout/SectionBlock';
import type { Markdown } from '../blocks/text/Markdown';
import type { PlainText } from '../blocks/text/PlainText';
import { isNotNull } from '../isNotNull';
import { BlockContext } from './BlockContext';
import type { BlockRenderers } from './BlockRenderers';
import type { Conditions } from './Conditions';
import { renderBlockElement } from './renderBlockElement';
import { renderLayoutBlock } from './renderLayoutBlock';
import { renderTextObject } from './renderTextObject';
import { resolveConditionalBlocks } from './resolveConditionalBlocks';

export abstract class SurfaceRenderer<TOutputObject, TAllowedLayoutBlock extends RenderableLayoutBlock = RenderableLayoutBlock>
	implements BlockRenderers<TOutputObject>
{
	protected readonly allowedLayoutBlockTypes: Set<TAllowedLayoutBlock['type']>;

	public constructor(allowedLayoutBlockTypes: TAllowedLayoutBlock['type'][]) {
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
			.filter(isNotNull);
	}

	public renderTextObject(textObject: TextObject, index: number, context: BlockContext): TOutputObject | null {
		return renderTextObject(this, context)(textObject, index);
	}

	public renderActionsBlockElement(block: BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.ACTIONS) === false && !isActionsBlockElement(block)) {
			return null;
		}

		return renderBlockElement(this, BlockContext.ACTION)(block, index);
	}

	/** @deprecated */
	public renderActions(
		element: ActionsBlock['elements'][number],
		_context: BlockContext,
		_: undefined,
		index: number,
	): TOutputObject | null {
		return this.renderActionsBlockElement(element, index);
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

	/** @deprecated */
	public renderContext(
		element: ContextBlock['elements'][number],
		_context: BlockContext,
		_: undefined,
		index: number,
	): TOutputObject | null {
		return this.renderContextBlockElement(element, index);
	}

	public renderInputBlockElement(block: BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.INPUT) === false && !isInputBlockElement(block)) {
			return null;
		}

		return renderBlockElement(this, BlockContext.FORM)(block, index);
	}

	/** @deprecated */
	public renderInputs(element: InputBlock['element'], _context: BlockContext, _: undefined, index: number): TOutputObject | null {
		return this.renderInputBlockElement(element, index);
	}

	public renderSectionAccessoryBlockElement(block: BlockElement, index: number): TOutputObject | null {
		if (this.allowedLayoutBlockTypes.has(LayoutBlockType.SECTION) === false && !isSectionBlockAccessoryElement(block)) {
			return null;
		}

		return renderBlockElement(this, BlockContext.SECTION)(block, index);
	}

	/** @deprecated */
	public renderAccessories(
		element: Exclude<SectionBlock['accessory'], undefined>,
		_context: BlockContext,
		_: undefined,
		index: number,
	): TOutputObject | null {
		return this.renderSectionAccessoryBlockElement(element, index);
	}

	/** @deprecated */
	public plainText(element: PlainText, context: BlockContext = BlockContext.NONE, index = 0): TOutputObject | null {
		return this[TextObjectType.PLAIN_TEXT](element, context, index);
	}

	/** @deprecated */
	public text(textObject: TextObject, context: BlockContext = BlockContext.NONE, index = 0): TOutputObject | null {
		switch (textObject.type) {
			case TextObjectType.PLAIN_TEXT:
				return this.plain_text(textObject, context, index);

			case TextObjectType.MRKDWN:
				return this.mrkdwn(textObject, context, index);

			default:
				return null;
		}
	}

	public abstract plain_text(textObject: PlainText, context: BlockContext, index: number): TOutputObject | null;

	public abstract mrkdwn(textObject: Markdown, context: BlockContext, index: number): TOutputObject | null;
}
