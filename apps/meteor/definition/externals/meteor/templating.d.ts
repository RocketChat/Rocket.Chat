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
		authorize: BlazeTemplate;
		oauth404: BlazeTemplate;
		icon: BlazeTemplate<{
			block?: string;
			icon: string;
		}>;
		CodeMirror: BlazeTemplate;
		photoswipeContent: BlazeTemplate;
		roomSearch: BlazeTemplate<typeof AutoComplete>;
		roomSearchEmpty: BlazeTemplate;
		avatar: BlazeTemplate;
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
		error: Blaze.Template<any, Blaze.TemplateInstance<any>>;
		loading: Blaze.Template<any, Blaze.TemplateInstance<any>>;
		collapseArrow: Blaze.Template<any, Blaze.TemplateInstance<any>>;
		rc_modal: Blaze.Template<any, Blaze.TemplateInstance<any>>;
		error: BlazeTemplate;
		loading: BlazeTemplate;
		messagePopupSlashCommandPreview: BlazeTemplate<{
			tmid?: IMessage['_id'];
			rid: IRoom['_id'];
			getInput: () => HTMLTextAreaElement | null;
		}>;
		rc_modal: BlazeTemplate;
		messagePopupCannedResponse: BlazeTemplate;
	};

	interface TemplateStatic extends BlazeTemplates {
		instance<TTemplateName extends keyof TemplateStatic>(): TemplateStatic[TTemplateName] extends Blaze.Template<any, infer I> ? I : never;
	}
}
