import 'meteor/templating';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveVar } from 'meteor/reactive-var';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';

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
		requiresPermission: BlazeTemplate;
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
		icon: BlazeTemplate<{
			block?: string;
			icon: string;
		}>;
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
		message: BlazeTemplate<{
			msg: Omit<IMessage, 'groupable'> & { searchedText?: string; customClass?: string; actionContext?: string; groupable?: boolean };
			room?: Omit<IRoom, '_updatedAt' | 'lastMessage'>;
			subscription?: Pick<ISubscription, 'name' | 'autoTranslate' | 'rid' | 'tunread' | 'tunreadUser' | 'tunreadGroup'>;
			settings: {
				translateLanguage?: unknown;
				autoImageLoad?: unknown;
				saveMobileBandwidth?: unknown;
				collapseMediaByDefault?: unknown;
				showreply?: unknown;
				showReplyButton?: unknown;
				hasPermissionDeleteMessage?: unknown;
				hasPermissionDeleteOwnMessage?: unknown;
				hideRoles?: unknown;
				UI_Use_Real_Name?: unknown;
				Chatops_Username?: unknown;
				AutoTranslate_Enabled?: unknown;
				Message_AllowEditing?: unknown;
				Message_AllowEditing_BlockEditInMinutes?: unknown;
				API_Embed?: unknown;
				Message_GroupingPeriod?: unknown;
			};
			u?: Partial<IUser>;
			[key: string]: any;
		}>;
		messageThread: BlazeTemplate;
		messagePopup: BlazeTemplate;
		messagePopupChannel: BlazeTemplate;
		messagePopupConfig: BlazeTemplate<{
			rid: IRoom['_id'];
			tmid?: IMessage['_id'];
			getInput: () => HTMLTextAreaElement | null;
		}>;
		messagePopupEmoji: BlazeTemplate;
		messagePopupSlashCommand: BlazeTemplate;
		messagePopupSlashCommandPreview: BlazeTemplate<{
			tmid?: IMessage['_id'];
			rid: IRoom['_id'];
			getInput: () => HTMLTextAreaElement | null;
		}>;
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
