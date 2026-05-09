import type { IRoom, ISubscription, ISupportedLanguage, ITranslatedMessage, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { isTranslatedMessageAttachment } from '@rocket.chat/core-typings';
import mem from 'mem';

import { PermissionsCachedStore } from '../../../../client/cachedStores';
import { settings } from '../../../../client/lib/settings';
import { getUserId, userIdStore } from '../../../../client/lib/user';
import { Messages, Subscriptions, Users } from '../../../../client/stores';
import {
	hasTranslationLanguageInAttachments,
	hasTranslationLanguageInMessage,
} from '../../../../client/views/room/MessageList/lib/autoTranslate';
import { hasPermission } from '../../../authorization/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

let userLanguage = 'en';
let username = '';

const refreshUserCache = () => {
	const uid = userIdStore.getState();
	const user = uid ? Users.use.getState().get(uid) : undefined;
	if (!user) return;
	userLanguage = user.language || 'en';
	username = user.username || '';
};
refreshUserCache();
userIdStore.subscribe(refreshUserCache);
Users.use.subscribe(refreshUserCache);

export const AutoTranslate = {
	initialized: false,
	providersMetadata: {} as { [providerNamer: string]: { name: string; displayName: string } },
	messageIdsToWait: {} as { [messageId: string]: boolean },
	supportedLanguages: [] as ISupportedLanguage[] | undefined,

	findSubscriptionByRid: mem((rid) => Subscriptions.state.find((record) => record.rid === rid)),

	getLanguage(rid: IRoom['_id']): string {
		let subscription: ISubscription | undefined;
		if (rid) {
			subscription = this.findSubscriptionByRid(rid);
		}
		const language = (subscription?.autoTranslateLanguage || userLanguage || window.defaultUserLanguage?.()) as string;
		if (language.indexOf('-') !== -1) {
			if (!(this.supportedLanguages || []).some((supportedLanguage) => supportedLanguage.language === language)) {
				return language.slice(0, 2);
			}
		}
		return language;
	},

	translateAttachments(
		attachments: MessageAttachmentDefault[],
		language: string,
		autoTranslateShowInverse: boolean,
	): MessageAttachmentDefault[] {
		if (!isTranslatedMessageAttachment(attachments)) {
			return attachments;
		}
		for (const attachment of attachments) {
			if (attachment.author_name !== username) {
				if (attachment.text && attachment.translations && attachment.translations[language]) {
					attachment.translations.original = attachment.text;

					if (autoTranslateShowInverse) {
						attachment.text = attachment.translations.original;
					} else {
						attachment.text = attachment.translations[language];
					}
				}

				if (attachment.attachments && attachment.attachments.length > 0) {
					// @ts-expect-error - not sure what to do with this
					attachment.attachments = this.translateAttachments(attachment.attachments, language);
				}
			}
		}
		return attachments;
	},

	init(): void {
		if (this.initialized) {
			return;
		}

		const loadProviders = async () => {
			try {
				[this.providersMetadata, this.supportedLanguages] = await Promise.all([
					sdk.call('autoTranslate.getProviderUiMetadata'),
					sdk.call('autoTranslate.getSupportedLanguages', 'en'),
				]);
			} catch (e: unknown) {
				// Avoid unwanted error message on UI when autotranslate is disabled while fetching data
				console.error((e as Error).message);
			}
		};

		let loaded = false;
		const unsubs: Array<() => void> = [];
		const tryLoad = async () => {
			if (loaded) return;
			if (!settings.peek('AutoTranslate_Enabled') || !userIdStore.getState() || !hasPermission('auto-translate')) {
				return;
			}
			loaded = true;
			unsubs.splice(0).forEach((unsubscribe) => unsubscribe());
			await loadProviders();
		};

		unsubs.push(userIdStore.subscribe(() => void tryLoad()));
		unsubs.push(settings.observe('AutoTranslate_Enabled', () => void tryLoad()));
		unsubs.push(PermissionsCachedStore.useReady.subscribe(() => void tryLoad()));

		void tryLoad();

		Subscriptions.use.subscribe(() => {
			mem.clear(this.findSubscriptionByRid);
		});

		this.initialized = true;
	},
};

export const createAutoTranslateMessageStreamHandler = (): ((message: ITranslatedMessage) => void) => {
	AutoTranslate.init();

	return (message: ITranslatedMessage): void => {
		if (message.u && message.u._id !== getUserId()) {
			const subscription = AutoTranslate.findSubscriptionByRid(message.rid);
			const language = AutoTranslate.getLanguage(message.rid);
			if (
				subscription &&
				subscription.autoTranslate === true &&
				message.msg &&
				(!message.translations ||
					(!hasTranslationLanguageInMessage(message, language) && !hasTranslationLanguageInAttachments(message.attachments, language)))
			) {
				Messages.state.update(
					(record) => record._id === message._id,
					(record) => ({
						...record,
						autoTranslateFetching: true,
					}),
				);
			} else if (AutoTranslate.messageIdsToWait[message._id] !== undefined && subscription && subscription.autoTranslate !== true) {
				Messages.state.update(
					(record) => record._id === message._id,
					({ autoTranslateFetching: _, ...record }) => ({
						...record,
					}),
				);
				delete AutoTranslate.messageIdsToWait[message._id];
			} else if (message.autoTranslateFetching === true) {
				Messages.state.update(
					(record) => record._id === message._id,
					({ autoTranslateFetching: _, ...record }) => record,
				);
			}
		}
	};
};
