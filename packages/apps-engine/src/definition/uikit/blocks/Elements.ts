import type { IOptionObject, ITextObject } from './Objects';

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export enum BlockElementType {
    BUTTON = 'button',
    IMAGE = 'image',
    OVERFLOW_MENU = 'overflow',
    PLAIN_TEXT_INPUT = 'plain_text_input',
    STATIC_SELECT = 'static_select',
    MULTI_STATIC_SELECT = 'multi_static_select',
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export enum InputElementDispatchAction {
    ON_CHARACTER_ENTERED = 'on_character_entered',
    ON_ITEM_SELECTED = 'on_item_selected',
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IBlockElement {
    type: BlockElementType;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export type AccessoryElements = IButtonElement | IImageElement | IOverflowMenuElement;

export interface IInteractiveElement extends IBlockElement {
    actionId: string;
}

export interface IInputElement extends IBlockElement {
    actionId: string;
    placeholder: ITextObject;
    initialValue?: string | Array<string>;
    dispatchActionConfig?: Array<InputElementDispatchAction>;
}

export enum ButtonStyle {
    PRIMARY = 'primary',
    DANGER = 'danger',
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IButtonElement extends IInteractiveElement {
    type: BlockElementType.BUTTON;
    text: ITextObject;
    value?: string;
    url?: string;
    style?: ButtonStyle;
    // confirm?: IConfirmationDialogObject;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IImageElement extends IBlockElement {
    type: BlockElementType.IMAGE;
    imageUrl: string;
    altText: string;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IOverflowMenuElement extends IInteractiveElement {
    type: BlockElementType.OVERFLOW_MENU;
    options: Array<IOptionObject>;
    // confirm?: IConfirmationDialogObject;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IPlainTextInputElement extends IInputElement {
    type: BlockElementType.PLAIN_TEXT_INPUT;
    initialValue?: string;
    multiline?: boolean;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface ISelectElement extends IInputElement {
    type: BlockElementType.STATIC_SELECT | BlockElementType.MULTI_STATIC_SELECT;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IStaticSelectElement extends ISelectElement {
    type: BlockElementType.STATIC_SELECT;
    placeholder: ITextObject;
    options: Array<IOptionObject>;
    initialValue?: string;
}

/**
 * @deprecated please prefer the rocket.chat/ui-kit components
 */
export interface IMultiStaticSelectElement extends ISelectElement {
    type: BlockElementType.MULTI_STATIC_SELECT;
    placeholder: ITextObject;
    options: Array<IOptionObject>;
    initialValue?: Array<string>;
}
