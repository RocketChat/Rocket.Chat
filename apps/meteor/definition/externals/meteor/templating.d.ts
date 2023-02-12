import 'meteor/templating';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveVar } from 'meteor/reactive-var';
import type { IRoom } from '@rocket.chat/core-typings';

declare module 'meteor/blaze' {
	namespace Blaze {
		interface Template {
			events(
				eventsMap: Record<
					string,
					(
						this: TInstance,
						event: {
							[K in keyof JQuery.TriggeredEvent]: any;
						},
						instance: TInstance,
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
		requiresPermission: BlazeTemplate;
		ChatpalAdmin: BlazeTemplate;
		ChatpalSearchResultTemplate: BlazeTemplate;
		ChatpalSearchSingleTemplate: BlazeTemplate;
		ChatpalSearchSingleUser: BlazeTemplate;
		ChatpalSearchSingleRoom: BlazeTemplate;
		ChatpalSuggestionItemTemplate: BlazeTemplate;
		emojiPicker: BlazeTemplate;
		lazyloadImage: BlazeTemplate;
		customFieldsForm: BlazeTemplate;
		ExternalFrameContainer: BlazeTemplate;
		broadcastView: BlazeTemplate;
		liveStreamBroadcast: BlazeTemplate;
		liveStreamTab: BlazeTemplate;
		liveStreamView: BlazeTemplate;
		inputAutocomplete: BlazeTemplate;
		textareaAutocomplete: BlazeTemplate;
		_autocompleteContainer: BlazeTemplate;
		_noMatch: BlazeTemplate;
		authorize: BlazeTemplate;
		oauth404: BlazeTemplate;
		oembedBaseWidget: BlazeTemplate;
		oembedAudioWidget: BlazeTemplate;
		oembedFrameWidget: BlazeTemplate;
		oembedImageWidget: BlazeTemplate;
		oembedUrlWidget: BlazeTemplate;
		oembedVideoWidget: BlazeTemplate;
		oembedYoutubeWidget: BlazeTemplate;
		DefaultSearchResultTemplate: BlazeTemplate;
		DefaultSuggestionItemTemplate: BlazeTemplate;
		RocketSearch: BlazeTemplate<
			{
				rid: IRoom['_id'];
			},
			{
				provider: ReactiveVar<any>;
				isActive: ReactiveVar<boolean>;
				error: ReactiveVar<string | undefined>;
				suggestions: ReactiveVar<any>;
				suggestionActive: ReactiveVar<any>;
			}
		>;
		icon: BlazeTemplate;
		popupList: BlazeTemplate;
		popupList_default: BlazeTemplate;
		popupList_item_default: BlazeTemplate;
		popupList_loading: BlazeTemplate;
		popupList_item_channel: BlazeTemplate;
		popupList_item_custom: BlazeTemplate;
		selectDropdown: BlazeTemplate;
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
		error: BlazeTemplate;
		loading: BlazeTemplate;
		message: BlazeTemplate;
		messageThread: BlazeTemplate;
		messagePopup: BlazeTemplate;
		messagePopupChannel: BlazeTemplate;
		messagePopupConfig: BlazeTemplate;
		messagePopupEmoji: BlazeTemplate;
		messagePopupSlashCommand: BlazeTemplate;
		messagePopupSlashCommandPreview: BlazeTemplate;
		messagePopupUser: BlazeTemplate;
		collapseArrow: BlazeTemplate;
		rc_modal: BlazeTemplate;
		popout: BlazeTemplate;
		popover: BlazeTemplate;
		messagePopupCannedResponse: BlazeTemplate;
	};

	interface TemplateStatic extends BlazeTemplates {
		instance<TTemplateName extends keyof TemplateStatic>(): TemplateStatic[TTemplateName] extends Blaze.Template<any, infer I> ? I : never;
	}
}
