import type { IActionsBlock, IBlock, IConditionalBlockFilters, IContextBlock, IImageBlock, IInputBlock, ISectionBlock } from './Blocks';
import type { IBlockElement, IButtonElement, IImageElement, IInteractiveElement, IMultiStaticSelectElement, IOverflowMenuElement, IPlainTextInputElement, IStaticSelectElement } from './Elements';
import type { ITextObject } from './Objects';
import type { Omit } from '../../../lib/utils';
type BlockFunctionParameter<T extends IBlock> = Omit<T, 'type'>;
type ElementFunctionParameter<T extends IBlockElement> = T extends IInteractiveElement ? Omit<T, 'type' | 'actionId'> | Partial<Pick<T, 'actionId'>> : Omit<T, 'type'>;
type SectionBlockParam = BlockFunctionParameter<ISectionBlock>;
type ImageBlockParam = BlockFunctionParameter<IImageBlock>;
type ActionsBlockParam = BlockFunctionParameter<IActionsBlock>;
type ContextBlockParam = BlockFunctionParameter<IContextBlock>;
type InputBlockParam = BlockFunctionParameter<IInputBlock>;
type ButtonElementParam = ElementFunctionParameter<IButtonElement>;
type ImageElementParam = ElementFunctionParameter<IImageElement>;
type OverflowMenuElementParam = ElementFunctionParameter<IOverflowMenuElement>;
type PlainTextInputElementParam = ElementFunctionParameter<IPlainTextInputElement>;
type StaticSelectElementParam = ElementFunctionParameter<IStaticSelectElement>;
type MultiStaticSelectElementParam = ElementFunctionParameter<IMultiStaticSelectElement>;
/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export declare class BlockBuilder {
    private readonly appId;
    private readonly blocks;
    constructor(appId: string);
    addSectionBlock(block: SectionBlockParam): BlockBuilder;
    addImageBlock(block: ImageBlockParam): BlockBuilder;
    addDividerBlock(): BlockBuilder;
    addActionsBlock(block: ActionsBlockParam): BlockBuilder;
    addContextBlock(block: ContextBlockParam): BlockBuilder;
    addInputBlock(block: InputBlockParam): BlockBuilder;
    addConditionalBlock(innerBlocks: BlockBuilder | Array<IBlock>, condition?: IConditionalBlockFilters): BlockBuilder;
    getBlocks(): IBlock[];
    newPlainTextObject(text: string, emoji?: boolean): ITextObject;
    newMarkdownTextObject(text: string): ITextObject;
    newButtonElement(info: ButtonElementParam): IButtonElement;
    newImageElement(info: ImageElementParam): IImageElement;
    newOverflowMenuElement(info: OverflowMenuElementParam): IOverflowMenuElement;
    newPlainTextInputElement(info: PlainTextInputElementParam): IPlainTextInputElement;
    newStaticSelectElement(info: StaticSelectElementParam): IStaticSelectElement;
    newMultiStaticElement(info: MultiStaticSelectElementParam): IMultiStaticSelectElement;
    private newInteractiveElement;
    private newInputElement;
    private newSelectElement;
    private addBlock;
    private generateBlockId;
    private generateActionId;
}
export {};
