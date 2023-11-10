import type { DistributiveOmit, UiKit } from '@rocket.chat/core-typings';
import { createContext } from 'react';

type ActionManager = {
	on(viewId: string, listener: (data: any) => void): void;
	on(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	off(viewId: string, listener: (data: any) => any): void;
	off(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	generateTriggerId(appId: string | undefined): string;
	emitInteraction(appId: string, userInteraction: DistributiveOmit<UiKit.UserInteraction, 'triggerId'>): Promise<unknown>;
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
};

export const ActionManagerContext = createContext<ActionManager | undefined>(undefined);
