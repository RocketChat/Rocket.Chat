import type { DistributiveOmit } from '@rocket.chat/core-typings';
import type * as UiKit from '@rocket.chat/ui-kit';
import { createContext } from 'react';

/**
 * Generic listener type for action events
 * Generic parameter allows type-safe handling of different event data types
 * Returns void since listeners are event handlers, not transformers
 */
export type ActionEventListener<T = unknown> = (data: T) => void;

/**
 * An action manager is responsible for handling interactions with the UiKit.
 */
export interface IActionManager {
	on(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	on(viewId: string, listener: ActionEventListener<UiKit.ServerInteraction>): void;
	off(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	off(viewId: string, listener: ActionEventListener<UiKit.ServerInteraction>): void;
	notifyBusy(): void;
	notifyIdle(): void;
	generateTriggerId(appId: string | undefined): string;
	emitInteraction(appId: string, userInteraction: DistributiveOmit<UiKit.UserInteraction, 'triggerId'>): Promise<void>;
	handleServerInteraction(interaction: UiKit.ServerInteraction): UiKit.ServerInteraction['type'] | undefined;
	getInteractionPayloadByViewId(viewId: UiKit.ContextualBarView['id']):
		| {
				view: UiKit.ContextualBarView;
		  }
		| undefined;
	openView(surface: 'modal', view: UiKit.ModalView): void;
	openView(surface: 'banner', view: UiKit.BannerView): void;
	openView(surface: 'contextual_bar', view: UiKit.ContextualBarView): void;
	disposeView(viewId: UiKit.ModalView['id'] | UiKit.BannerView['viewId'] | UiKit.ContextualBarView['id']): void;
}

export const ActionManagerContext = createContext<IActionManager | undefined>(undefined);
