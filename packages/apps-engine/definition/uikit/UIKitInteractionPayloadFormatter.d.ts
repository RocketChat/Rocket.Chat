import type { IUIKitContextualBarInteraction, IUIKitErrorInteraction, IUIKitInteraction, IUIKitModalInteraction } from './IUIKitInteractionType';
import type { IUIKitContextualBarViewParam, IUIKitModalViewParam } from './UIKitInteractionResponder';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';
export declare function formatModalInteraction(view: IUIKitModalViewParam, context: IUIKitInteraction): IUIKitModalInteraction;
export declare function formatContextualBarInteraction(view: IUIKitContextualBarViewParam, context: IUIKitInteraction): IUIKitContextualBarInteraction;
export declare function formatErrorInteraction(errorInteraction: IUIKitErrorInteractionParam, context: IUIKitInteraction): IUIKitErrorInteraction;
