import 'meteor/templating';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveVar } from 'meteor/reactive-var';
import type { IMessage, IRoom, SlashCommandPreviews } from '@rocket.chat/core-typings';

declare module 'meteor/blaze' {
	namespace Blaze {
		interface Template<D = any, T = Blaze.TemplateInstance<D>> {
			events(
				eventsMap: Record<
					string,
					(
						this: any,
						event: {
							[K in keyof JQuery.TriggeredEvent | keyof JQuery.KeyboardEventBase]: any;
						},
						instance: T,
					) => void
				>,
			): void;
		}
	}
}

declare module 'meteor/templating' {
	type BlazeTemplate<TData = any, TInstanceExtras = Record<string, never>> = Blaze.Template<
		TData,
		Blaze.TemplateInstance<TData> & TInstanceExtras
	>;

	type BlazeTemplates = {
		emojiPicker: BlazeTemplate;
		ExternalFrameContainer: BlazeTemplate;
		inputAutocomplete: BlazeTemplate;
		_autocompleteContainer: BlazeTemplate;
		_noMatch: BlazeTemplate;
		photoswipeContent: BlazeTemplate;
		loading: BlazeTemplate;
		messagePopupSlashCommandPreview: BlazeTemplate<
			{
				tmid?: IMessage['_id'];
				rid: IRoom['_id'];
				getInput: () => HTMLTextAreaElement | null;
			},
			{
				open: ReactiveVar<boolean>;
				isLoading: ReactiveVar<boolean>;
				preview: ReactiveVar<SlashCommandPreviews | undefined>;
				selectedItem: ReactiveVar<unknown>;
				commandName: ReactiveVar<string>;
				commandArgs: ReactiveVar<string>;
				matchSelectorRegex: RegExp;
				selectorRegex: RegExp;
				replaceRegex: RegExp;
				dragging: boolean;
				fetchPreviews: (cmd: string, args: string) => void;
				enterKeyAction: () => void;
				selectionLogic: () => void;
				verifySelection: () => void;
				onInputKeyup: (event: JQuery.TriggeredEvent) => void;
				onInputKeydown: (event: JQuery.TriggeredEvent) => void;
				inputBox: HTMLTextAreaElement | null;
				up(): void;
				down(): void;
				onFocus(): void;
				onBlur(): void;
				clickingItem?: boolean;
			}
		>;
	};

	interface TemplateStatic extends BlazeTemplates {
		instance<TTemplateName extends keyof TemplateStatic>(): TemplateStatic[TTemplateName] extends Blaze.Template<any, infer I> ? I : never;
	}
}
