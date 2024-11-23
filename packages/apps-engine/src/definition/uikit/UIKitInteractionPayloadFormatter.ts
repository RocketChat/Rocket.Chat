import { v1 as uuid } from 'uuid';

import type { IUIKitContextualBarInteraction, IUIKitErrorInteraction, IUIKitInteraction, IUIKitModalInteraction } from './IUIKitInteractionType';
import { UIKitInteractionType } from './IUIKitInteractionType';
import type { IUIKitSurface } from './IUIKitSurface';
import { UIKitSurfaceType } from './IUIKitSurface';
import type { IUIKitContextualBarViewParam, IUIKitModalViewParam } from './UIKitInteractionResponder';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';

function isModalInteraction(type: IUIKitInteraction['type']): type is IUIKitModalInteraction['type'] {
    return [UIKitInteractionType.MODAL_OPEN, UIKitInteractionType.MODAL_UPDATE, UIKitInteractionType.MODAL_CLOSE].includes(type);
}

export function formatModalInteraction(view: IUIKitModalViewParam, context: IUIKitInteraction): IUIKitModalInteraction {
    if (!isModalInteraction(context.type)) {
        throw new Error(`Invalid type "${context.type}" for modal interaction`);
    }

    return {
        type: context.type,
        triggerId: context.triggerId,
        appId: context.appId,
        view: {
            appId: context.appId,
            type: UIKitSurfaceType.MODAL,
            id: view.id ? view.id : uuid(),
            ...view,
            showIcon: true,
        } as IUIKitSurface,
    };
}

function isContextualBarInteraction(type: IUIKitInteraction['type']): type is IUIKitContextualBarInteraction['type'] {
    return [UIKitInteractionType.CONTEXTUAL_BAR_OPEN, UIKitInteractionType.CONTEXTUAL_BAR_UPDATE, UIKitInteractionType.CONTEXTUAL_BAR_CLOSE].includes(type);
}

export function formatContextualBarInteraction(view: IUIKitContextualBarViewParam, context: IUIKitInteraction): IUIKitContextualBarInteraction {
    if (!isContextualBarInteraction(context.type)) {
        throw new Error(`Invalid type "${context.type}" for contextual bar interaction`);
    }

    return {
        type: context.type,
        triggerId: context.triggerId,
        appId: context.appId,
        view: {
            appId: context.appId,
            type: UIKitSurfaceType.CONTEXTUAL_BAR,
            id: view.id ? view.id : uuid(),
            ...view,
            showIcon: true,
        } as IUIKitSurface,
    };
}

export function formatErrorInteraction(errorInteraction: IUIKitErrorInteractionParam, context: IUIKitInteraction): IUIKitErrorInteraction {
    if (UIKitInteractionType.ERRORS !== context.type) {
        throw new Error(`Invalid type "${context.type}" for error interaction`);
    }

    return {
        appId: context.appId,
        type: UIKitInteractionType.ERRORS,
        errors: errorInteraction.errors,
        viewId: errorInteraction.viewId,
        triggerId: context.triggerId,
    };
}
