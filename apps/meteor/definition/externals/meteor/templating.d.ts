import 'meteor/templating';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveVar } from 'meteor/reactive-var';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';

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
		customFieldsForm: BlazeTemplate;
		ExternalFrameContainer: BlazeTemplate;
		inputAutocomplete: BlazeTemplate;
		_autocompleteContainer: BlazeTemplate;
		_noMatch: BlazeTemplate;
		CodeMirror: BlazeTemplate;
		photoswipeContent: BlazeTemplate;
		roomSearch: BlazeTemplate<typeof AutoComplete>;
		roomSearchEmpty: BlazeTemplate;
		username: BlazeTemplate<
			Record<string, never>,
			{
				customFields: ReactiveVar<Record<
					string,
					{
						required?: boolean;
						maxLength?: number;
						minLength?: number;
					}
				> | null>;
				username: ReactiveVar<{
					ready: boolean;
					username: string;
					empty?: boolean;
					error?: boolean;
					invalid?: boolean;
					escaped?: string;
					blocked?: boolean;
					unavailable?: boolean;
				}>;
				validate: () => unknown;
			}
		>;
		loading: BlazeTemplate;
		messagePopupSlashCommandPreview: BlazeTemplate<{
			tmid?: IMessage['_id'];
			rid: IRoom['_id'];
			getInput: () => HTMLTextAreaElement | null;
		}>;
	};

	interface TemplateStatic extends BlazeTemplates {
		instance<TTemplateName extends keyof TemplateStatic>(): TemplateStatic[TTemplateName] extends Blaze.Template<any, infer I> ? I : never;
	}
}
