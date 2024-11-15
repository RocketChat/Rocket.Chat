import type { IUIKitContextualBarResponse, IUIKitErrorResponse, IUIKitModalResponse, IUIKitResponse } from './IUIKitInteractionType';
import type { IUIKitSurface } from './IUIKitSurface';
import type { IUIKitBaseIncomingInteraction } from './UIKitIncomingInteractionTypes';
import type { Omit } from '../../lib/utils';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';
export type IUIKitModalViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
export type IUIKitContextualBarViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
export declare class UIKitInteractionResponder {
    private readonly baseContext;
    constructor(baseContext: IUIKitBaseIncomingInteraction);
    successResponse(): IUIKitResponse;
    errorResponse(): IUIKitResponse;
    openModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse;
    updateModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse;
    openContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse;
    updateContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse;
    viewErrorResponse(errorInteraction: IUIKitErrorInteractionParam): IUIKitErrorResponse;
}
