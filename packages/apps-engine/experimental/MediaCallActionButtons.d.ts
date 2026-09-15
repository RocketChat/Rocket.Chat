import type { IRoom } from '../definition/rooms';
import type { IUIKitResponse } from '../definition/uikit/IUIKitInteractionType';
import type { IUIKitBaseIncomingInteraction } from '../definition/uikit/UIKitIncomingInteractionTypes';
import type {
	UIKitMediaCallWidgetActionButtonInteractionContext,
	UIKitActionButtonInteractionContext,
} from '../definition/uikit/UIKitInteractionContext';
import type { IUIKitMediaCallWidgetInteractionResponder } from '../definition/uikit/UIKitInteractionResponder';
import '../definition/ui/IUIActionButtonDescriptor';
import '../definition/uikit/UIKitInteractionResponder';
import '../definition/uikit/UIKitInteractionContext';

export declare function makeMediaCallWidgetInteractionContext(
	interaction: UIKitActionButtonInteractionContext,
): UIKitMediaCallWidgetActionButtonInteractionContext;

declare module '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext' {
	export class UIKitMediaCallWidgetActionButtonInteractionContext {
		getInteractionData(): IUIKitActionButtonMediaCallWidgetIncomingInteraction;

		getInteractionResponder(): IUIKitMediaCallWidgetInteractionResponder;
	}
}

declare module '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder' {
	/**
	 * @experimental
	 *
	 * Fields that can be selectively updated on the action button that triggered the interaction.
	 */
	export type IUIKitActionButtonUpdateParam = {
		/** Replaces the action ID registered for this button. */
		actionId?: string;
		/** Replaces the i18n key used to render the button label. */
		labelI18n?: string;
		/** Replaces the visual variant of the button. */
		variant?: 'default' | 'danger';
		/** Disables the button if `true`, enables it if `false`. */
		disabled?: boolean;
	};

	export interface IUIKitActionButtonUpdateResponse extends IUIKitResponse {
		type: 'action_button.update';
		update: IUIKitActionButtonUpdateParam;
	}

	export interface IUIKitMediaCallWidgetInteractionResponder extends UIKitInteractionResponder {
		/**
		 * @experimental
		 *
		 * Signals to the UI that the action button which triggered this interaction
		 * should have its properties updated in place. Any combination of the optional
		 * fields (`actionId`, `labelI18n`, `variant`, `disabled`) may be provided
		 */
		updateActionButtonResponse(update: IUIKitActionButtonUpdateParam): IUIKitActionButtonUpdateResponse;
	}
}

declare module '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor' {
	/**
	 * @experimental
	 *
	 * Media call widget states that the app can interact with.
	 *
	 * Can also be used as a filter when registering an action button
	 *
	 * Note: not equivalent to the actual media call state, which is controlled by the server.
	 */
	export type MediaCallWidgetState = 'calling' | 'ringing' | 'ongoing';

	export type MediaCallWidgetActionButtonDescriptor = IUIActionButtonDescriptorBase & {
		/**
		 * @experimental
		 *
		 * This context indicates the button should be displayed in the widget used to manage media calls
		 */
		context: 'mediaCallWidgetAction';
		when?: IUActionButtonWhen & {
			/**
			 * If provided, the button will only be shown when the widget is in one of the specified states.
			 * If not provided, the button will be shown in all states.
			 *
			 * The 'calling' state corresponds to the user activelly initiating a call.
			 * The 'ringing' state corresponds to the user receiving a call.
			 * The 'ongoing' state corresponds to the user being in an active call with others.
			 */
			callStates?: MediaCallWidgetState[];
		};
	};

	interface IUIActionButtonDescriptorMap {
		mediaCallWidgetAction: MediaCallWidgetActionButtonDescriptor;
	}
}

declare module '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext' {
	export interface IUIKitActionButtonMediaCallWidgetIncomingInteraction extends IUIKitBaseIncomingInteraction {
		buttonContext: 'mediaCallWidgetAction';
		actionId: string;
		triggerId: string;
		room?: IRoom;
		callId: string;
	}
}
