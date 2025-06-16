import type { IImportUser, IImportMessage, IImportPendingFile } from '@rocket.chat/core-typings';
import { Messages, Settings, ImportData } from '@rocket.chat/models';
import type { IZipEntry } from 'adm-zip';

import { Importer, ProgressStep, ImporterWebsocket } from '../../importer/server';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import { notifyOnSettingChanged } from '../../lib/server/lib/notifyListener';
import { MentionsParser } from '../../mentions/lib/MentionsParser';
import { settings } from '../../settings/server';
import { getUserAvatarURL } from '../../utils/server/getUserAvatarURL';

type SlackChannel = {
	id: string;
	name: string;
	topic?: {
		value: string;
		creator: string;
		last_set: number;
	};
	members: string[];
	purpose?: {
		value: string;
		creator: string;
		last_set: number;
	};
	created: number;
	creator: string | null;
	is_general: boolean;
	is_archived: boolean;
};

type SlackUser = {
	id: string;
	name: string;
	profile: {
		real_name: string;
		email: string;
		image_512: string;
		image_original: string;
		status_text: string;
		title: string;
	};
	tz_offset: number;
	deleted: boolean;
	is_bot: boolean;
};

type SlackFile = {
	id: string;
	url_private_download: string;
	size: number;
	name: string;
	is_external: boolean;
};

type SlackMessage = {
	id: string;
	ts: string;
	user: string;
	reactions?: {
		name: string;
		users: string[];
	}[];
	type: 'message';
	subtype?: string;
	files?: SlackFile[];
	text: string;
	edited?: {
		ts: string;
		user: string;
	};
	thread_ts?: string;
	reply_users?: string[];
	reply_count?: number;
	replies?: {
		user: string;
	}[];
	latest_reply: string;
	icons?: {
		emoji: string;
	};
	attachments?: SlackAttachment[];
} & (
	| {
			subtype: 'channel_purpose' | 'group_purpose';
			purpose: string;
	  }
	| {
			subtype: 'channel_join' | 'group_join' | 'channel_leave' | 'group_leave';
	  }
	| {
			subtype: 'channel_topic' | 'group_topic';
			topic: string;
	  }
	| {
			subtype: 'channel_name' | 'group_name';
			name: string;
	  }
	| {
			subtype: 'pinned_item';
			attachments: SlackAttachment[];
	  }
	| {
			subtype: 'file_share';
			file: SlackFile;
	  }
	| {
			subtype: 'me_message';
	  }
);

type SlackAttachment = {
	text: string;
	title: string;
	fallback: string;
	author_subname: string;
};

export class SlackImporter extends Importer {
	private _useUpsert = false;

	async prepareChannelsFile(entry: IZipEntry): Promise<number> {
		await super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		const data = (JSON.parse(entry.getData().toString()) as SlackChannel[]).filter(
			(channel): channel is SlackChannel & { creator: string } => 'creator' in channel && channel.creator != null,
		);

		this.logger.debug(`loaded ${data.length} channels.`);

		await this.addCountToTotal(data.length);

		for await (const channel of data) {
			await this.converter.addChannel({
				_id: channel.is_general ? 'general' : undefined,
				u: {
					_id: this._replaceSlackUserId(channel.creator),
				},
				importIds: [channel.id],
				name: channel.name,
				users: this._replaceSlackUserIds(channel.members),
				t: 'c',
				topic: channel.topic?.value || undefined,
				description: channel.purpose?.value || undefined,
				ts: channel.created ? new Date(channel.created * 1000) : undefined,
				archived: channel.is_archived,
			});
		}

		return data.length;
	}

	async prepareGroupsFile(entry: IZipEntry): Promise<number> {
		await super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		const data = (JSON.parse(entry.getData().toString()) as SlackChannel[]).filter(
			(channel): channel is SlackChannel & { creator: string } => 'creator' in channel && channel.creator != null,
		);

		this.logger.debug(`loaded ${data.length} groups.`);

		await this.addCountToTotal(data.length);

		for await (const channel of data) {
			await this.converter.addChannel({
				u: {
					_id: this._replaceSlackUserId(channel.creator),
				},
				importIds: [channel.id],
				name: channel.name,
				users: this._replaceSlackUserIds(channel.members),
				t: 'p',
				topic: channel.topic?.value || undefined,
				description: channel.purpose?.value || undefined,
				ts: channel.created ? new Date(channel.created * 1000) : undefined,
				archived: channel.is_archived,
			});
		}

		return data.length;
	}

	async prepareMpimpsFile(entry: IZipEntry): Promise<number> {
		await super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		const data = (JSON.parse(entry.getData().toString()) as SlackChannel[]).filter(
			(channel): channel is SlackChannel & { creator: string } => 'creator' in channel && channel.creator != null,
		);

		this.logger.debug(`loaded ${data.length} mpims.`);

		await this.addCountToTotal(data.length);

		const maxUsers = settings.get<number>('DirectMesssage_maxUsers') || 1;

		for await (const channel of data) {
			await this.converter.addChannel({
				u: {
					_id: this._replaceSlackUserId(channel.creator),
				},
				importIds: [channel.id],
				name: channel.name,
				users: this._replaceSlackUserIds(channel.members),
				t: channel.members.length > maxUsers ? 'p' : 'd',
				topic: channel.topic?.value || undefined,
				description: channel.purpose?.value || undefined,
				ts: channel.created ? new Date(channel.created * 1000) : undefined,
				archived: channel.is_archived,
			});
		}

		return data.length;
	}

	async prepareDMsFile(entry: IZipEntry): Promise<number> {
		await super.updateProgress(ProgressStep.PREPARING_CHANNELS);
		const data = JSON.parse(entry.getData().toString()) as SlackChannel[];

		this.logger.debug(`loaded ${data.length} dms.`);

		await this.addCountToTotal(data.length);
		for await (const channel of data) {
			await this.converter.addChannel({
				importIds: [channel.id],
				users: this._replaceSlackUserIds(channel.members),
				t: 'd',
				ts: channel.created ? new Date(channel.created * 1000) : undefined,
			});
		}

		return data.length;
	}

	async prepareUsersFile(entry: IZipEntry): Promise<number> {
		await super.updateProgress(ProgressStep.PREPARING_USERS);
		const data = JSON.parse(entry.getData().toString()) as SlackUser[];

		this.logger.debug(`loaded ${data.length} users.`);

		// Insert the users record
		await this.updateRecord({ 'count.users': data.length });
		await this.addCountToTotal(data.length);

		for await (const user of data) {
			const newUser: IImportUser = {
				emails: [],
				importIds: [user.id],
				username: user.name,
				name: user.profile.real_name,
				utcOffset: user.tz_offset && user.tz_offset / 3600,
				avatarUrl: user.profile.image_original || user.profile.image_512,
				deleted: user.deleted,
				statusText: user.profile.status_text || undefined,
				bio: user.profile.title || undefined,
				type: 'user',
			};

			if (user.profile.email) {
				newUser.emails.push(user.profile.email);
			}

			if (user.is_bot) {
				newUser.roles = ['bot'];
				newUser.type = 'bot';
			}

			await this.converter.addUser(newUser);
		}

		return data.length;
	}

	async prepareUsingLocalFile(fullFilePath: string): Promise<ImporterProgress> {
		this.logger.debug('start preparing import operation');
		await this.converter.clearImportData();

		const zip = new this.AdmZip(fullFilePath);
		const totalEntries = zip.getEntryCount();

		let userCount = 0;
		let messagesCount = 0;
		let channelCount = 0;
		let count = 0;

		ImporterWebsocket.progressUpdated({ rate: 0 });
		let oldRate = 0;

		const increaseProgress = () => {
			try {
				count++;
				const rate = Math.floor((count * 1000) / totalEntries) / 10;
				if (rate > oldRate) {
					ImporterWebsocket.progressUpdated({ rate });
					oldRate = rate;
				}
			} catch (e) {
				this.logger.error(e);
			}
		};

		try {
			// we need to iterate the zip file twice so that all channels are loaded before the messages
			for await (const entry of zip.getEntries()) {
				try {
					if (entry.entryName === 'channels.json') {
						channelCount += await this.prepareChannelsFile(entry);
						await this.updateRecord({ 'count.channels': channelCount });
						increaseProgress();
						continue;
					}

					if (entry.entryName === 'groups.json') {
						channelCount += await this.prepareGroupsFile(entry);
						await this.updateRecord({ 'count.channels': channelCount });
						increaseProgress();
						continue;
					}

					if (entry.entryName === 'mpims.json') {
						channelCount += await this.prepareMpimpsFile(entry);
						await this.updateRecord({ 'count.channels': channelCount });
						increaseProgress();
						continue;
					}

					if (entry.entryName === 'dms.json') {
						channelCount += await this.prepareDMsFile(entry);
						await this.updateRecord({ 'count.channels': channelCount });
						increaseProgress();
						continue;
					}

					if (entry.entryName === 'users.json') {
						userCount = await this.prepareUsersFile(entry);
						increaseProgress();
						continue;
					}
				} catch (e) {
					this.logger.error(e);
				}
			}

			if (userCount) {
				const value = await Settings.incrementValueById('Slack_Importer_Count', userCount, { returnDocument: 'after' });
				if (value) {
					void notifyOnSettingChanged(value);
				}
			}

			const missedTypes: Record<string, SlackMessage> = {};
			// If we have no slack message yet, then we can insert them instead of upserting
			this._useUpsert = !(await Messages.findOne({ _id: /slack\-.*/ }));

			for await (const entry of zip.getEntries()) {
				try {
					if (entry.entryName.includes('__MACOSX') || entry.entryName.includes('.DS_Store')) {
						count++;
						this.logger.debug(`Ignoring the file: ${entry.entryName}`);
						continue;
					}

					if (['channels.json', 'groups.json', 'mpims.json', 'dms.json', 'users.json'].includes(entry.entryName)) {
						continue;
					}

					if (!entry.isDirectory && entry.entryName.includes('/')) {
						const item = entry.entryName.split('/');

						const channel = item[0];
						const date = item[1].split('.')[0];

						try {
							// Insert the messages records
							if (this.progress.step !== ProgressStep.PREPARING_MESSAGES) {
								await super.updateProgress(ProgressStep.PREPARING_MESSAGES);
							}

							const tempMessages = JSON.parse(entry.getData().toString()) as SlackMessage[];
							messagesCount += tempMessages.length;
							await this.updateRecord({ messagesstatus: `${channel}/${date}` });
							await this.addCountToTotal(tempMessages.length);

							const slackChannelId = await ImportData.findChannelImportIdByNameOrImportId(channel);

							if (slackChannelId) {
								for await (const message of tempMessages) {
									await this.prepareMessageObject(message, missedTypes, slackChannelId);
								}
							}
						} catch (error) {
							this.logger.warn(`${entry.entryName} is not a valid JSON file! Unable to import it.`);
						}
					}
				} catch (e) {
					this.logger.error(e);
				}

				increaseProgress();
			}

			if (Object.keys(missedTypes).length > 0) {
				this.logger.info('Missed import types:', missedTypes);
			}
		} catch (e) {
			this.logger.error(e);
			throw e;
		}

		ImporterWebsocket.progressUpdated({ rate: 100 });
		await this.updateRecord({ 'count.messages': messagesCount, 'messagesstatus': null });

		return this.progress;
	}

	parseMentions(newMessage: IImportMessage): void {
		const mentionsParser = new MentionsParser({
			pattern: () => '[0-9a-zA-Z]+',
			useRealName: () => settings.get<boolean>('UI_Use_Real_Name'),
			me: () => 'me',
		});

		const users = mentionsParser
			.getUserMentions(newMessage.msg)
			.filter((u: string) => u)
			.map((uid: string) => this._replaceSlackUserId(uid.slice(1, uid.length)));
		if (users.length) {
			if (!newMessage.mentions) {
				newMessage.mentions = [];
			}
			newMessage.mentions.push(...users);
		}

		const channels = mentionsParser
			.getChannelMentions(newMessage.msg)
			.filter((c: string) => c)
			.map((name: string) => name.slice(1, name.length));
		if (channels.length) {
			if (!newMessage.channels) {
				newMessage.channels = [];
			}
			newMessage.channels.push(...channels);
		}
	}

	async processMessageSubType(
		message: SlackMessage,
		slackChannelId: string,
		newMessage: IImportMessage,
		missedTypes: Record<string, SlackMessage>,
	): Promise<boolean> {
		const ignoreTypes: Record<string, boolean> = { bot_add: true, file_comment: true, file_mention: true };

		switch (message.subtype) {
			case 'channel_join':
			case 'group_join':
				newMessage.t = 'uj';
				newMessage.groupable = false;
				return true;
			case 'channel_leave':
			case 'group_leave':
				newMessage.t = 'ul';
				newMessage.groupable = false;
				return true;
			case 'channel_purpose':
			case 'group_purpose':
				newMessage.t = 'room_changed_description';
				newMessage.groupable = false;
				newMessage.msg = message.purpose;
				return true;
			case 'channel_topic':
			case 'group_topic':
				newMessage.t = 'room_changed_topic';
				newMessage.groupable = false;
				newMessage.msg = message.topic;
				return true;
			case 'channel_name':
			case 'group_name':
				newMessage.t = 'r';
				newMessage.msg = message.name;
				newMessage.groupable = false;
				return true;
			case 'pinned_item':
				if (message.attachments) {
					if (!newMessage.attachments) {
						newMessage.attachments = [];
					}
					newMessage.attachments.push({
						text: this.convertSlackMessageToRocketChat(message.attachments[0].text),
						author_name: message.attachments[0].author_subname,
						author_icon: getUserAvatarURL(message.attachments[0].author_subname),
					});
					newMessage.t = 'message_pinned';
				}
				break;
			case 'file_share':
				if (message.file?.url_private_download) {
					const fileId = this.makeSlackMessageId(slackChannelId, message.ts, 'share');
					const fileMessage: IImportMessage = {
						_id: fileId,
						rid: newMessage.rid,
						ts: newMessage.ts,
						msg: message.file.url_private_download || '',
						_importFile: this.convertSlackFileToPendingFile(message.file),
						u: {
							_id: newMessage.u._id,
						},
					};

					if (message.thread_ts && message.thread_ts !== message.ts) {
						fileMessage.tmid = this.makeSlackMessageId(slackChannelId, message.thread_ts);
					}

					await this.converter.addMessage(fileMessage, this._useUpsert);
				}
				break;

			default:
				if (!missedTypes[message.subtype] && !ignoreTypes[message.subtype]) {
					missedTypes[message.subtype] = message;
				}
				break;
		}

		return false;
	}

	makeSlackMessageId(channelId: string, ts: string, fileIndex?: string): string {
		const base = `slack-${channelId}-${ts.replace(/\./g, '-')}`;

		if (fileIndex) {
			return `${base}-file${fileIndex}`;
		}

		return base;
	}

	async prepareMessageObject(message: SlackMessage, missedTypes: Record<string, SlackMessage>, slackChannelId: string): Promise<void> {
		const id = this.makeSlackMessageId(slackChannelId, message.ts);
		const newMessage: IImportMessage = {
			_id: id,
			rid: slackChannelId,
			ts: new Date(parseInt(message.ts.split('.')[0]) * 1000),
			msg: '',
			u: {
				_id: this._replaceSlackUserId(message.user),
			},
		};

		// Process the reactions
		if (message.reactions && message.reactions.length > 0) {
			newMessage.reactions = message.reactions.reduce(
				(newReactions, reaction) => {
					const name = `:${reaction.name}:`;
					return {
						...newReactions,
						...(reaction.users?.length ? { name: { name, users: this._replaceSlackUserIds(reaction.users) } } : {}),
					};
				},
				{} as Required<IImportMessage>['reactions'],
			);
		}

		if (message.type === 'message') {
			if (message.files) {
				let fileIndex = 0;
				const promises = message.files.map(async (file) => {
					fileIndex++;

					const fileId = this.makeSlackMessageId(slackChannelId, message.ts, String(fileIndex));
					const fileMessage: IImportMessage = {
						_id: fileId,
						rid: slackChannelId,
						ts: newMessage.ts,
						msg: file.url_private_download || '',
						_importFile: this.convertSlackFileToPendingFile(file),
						u: {
							_id: this._replaceSlackUserId(message.user),
						},
					};

					if (message.thread_ts && message.thread_ts !== message.ts) {
						fileMessage.tmid = this.makeSlackMessageId(slackChannelId, message.thread_ts);
					}

					await this.converter.addMessage(fileMessage, this._useUpsert);
				});
				await Promise.all(promises);
			}

			const regularTypes = ['me_message', 'thread_broadcast'];

			const isBotMessage = message.subtype && ['bot_message', 'slackbot_response'].includes(message.subtype);

			if (message.subtype && !regularTypes.includes(message.subtype) && !isBotMessage) {
				if (await this.processMessageSubType(message, slackChannelId, newMessage, missedTypes)) {
					await this.converter.addMessage(newMessage, this._useUpsert);
				}
			} else {
				const text = this.convertSlackMessageToRocketChat(message.text);

				if (isBotMessage) {
					newMessage.bot = true;
				}

				if (message.subtype === 'me_message') {
					newMessage.msg = `_${text}_`;
				} else {
					newMessage.msg = text;
				}

				if (message.thread_ts) {
					if (message.thread_ts === message.ts) {
						if (message.reply_users) {
							const replies = new Set<string>();
							message.reply_users.forEach((item: string) => {
								replies.add(this._replaceSlackUserId(item));
							});

							if (replies.size) {
								newMessage.replies = Array.from(replies);
							}
						} else if (message.replies) {
							const replies = new Set<string>();
							message.replies.forEach((item: { user: string }) => {
								replies.add(this._replaceSlackUserId(item.user));
							});

							if (replies.size) {
								newMessage.replies = Array.from(replies);
							}
						} else {
							this.logger.warn(`Failed to import the parent comment, message: ${newMessage._id}. Missing replies/reply_users field`);
						}

						newMessage.tcount = message.reply_count;
						newMessage.tlm = new Date(parseInt(message.latest_reply.split('.')[0]) * 1000);
					} else {
						newMessage.tmid = this.makeSlackMessageId(slackChannelId, message.thread_ts);
					}
				}

				if (message.edited) {
					newMessage.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
					if (message.edited.user) {
						newMessage.editedBy = this._replaceSlackUserId(message.edited.user);
					}
				}

				if (message.attachments) {
					newMessage.attachments = this.convertMessageAttachments(message.attachments);
				}

				if (message.icons?.emoji) {
					newMessage.emoji = message.icons.emoji;
				}

				this.parseMentions(newMessage);
				await this.converter.addMessage(newMessage, this._useUpsert);
			}
		}
	}

	_replaceSlackUserId(userId: string): string {
		if (userId === 'USLACKBOT') {
			return 'rocket.cat';
		}

		return userId;
	}

	_replaceSlackUserIds(members: string[]) {
		if (!members?.length) {
			return [];
		}
		return members.map((userId) => this._replaceSlackUserId(userId));
	}

	convertSlackMessageToRocketChat(message: string): string {
		if (message) {
			message = message.replace(/<!everyone>/g, '@all');
			message = message.replace(/<!channel>/g, '@all');
			message = message.replace(/<!here>/g, '@here');
			message = message.replace(/&gt;/g, '>');
			message = message.replace(/&lt;/g, '<');
			message = message.replace(/&amp;/g, '&');
			message = message.replace(/:simple_smile:/g, ':smile:');
			message = message.replace(/:memo:/g, ':pencil:');
			message = message.replace(/:piggy:/g, ':pig:');
			message = message.replace(/:uk:/g, ':gb:');
			message = message.replace(/<(http[s]?:[^>|]*)>/g, '$1');
			message = message.replace(/<(http[s]?:[^|]*)\|([^>]*)>/g, '[$2]($1)');
			message = message.replace(/<#([^|]*)\|([^>]*)>/g, '#$2');
			message = message.replace(/<@([^|]*)\|([^>]*)>/g, '@$1');
			message = message.replace(/<@([^|>]*)>/g, '@$1');
		} else {
			message = '';
		}

		return message;
	}

	convertSlackFileToPendingFile(file: SlackFile): IImportPendingFile {
		return {
			downloadUrl: file.url_private_download,
			id: file.id,
			size: file.size,
			name: file.name,
			external: file.is_external,
			source: 'slack',
			original: {
				...file,
			},
		};
	}

	convertMessageAttachments(attachments: SlackAttachment[]): IImportMessage['attachments'] {
		if (!attachments?.length) {
			return undefined;
		}

		return attachments.map((attachment) => ({
			...attachment,
			text: this.convertSlackMessageToRocketChat(attachment.text),
			title: this.convertSlackMessageToRocketChat(attachment.title),
			fallback: this.convertSlackMessageToRocketChat(attachment.fallback),
		}));
	}
}
