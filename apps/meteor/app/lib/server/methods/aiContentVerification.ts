import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../../lib/callbacks';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';

interface IAIVerificationResult {
	approved: boolean;
	reason?: string;
	confidence?: number;
	detectedCategories?: string[];
	suggestions?: string[];
}

interface IAIConfig {
	apiUrl: string;
	apiKey: string;
	timeout: number;
	threshold: number;
}

interface IMessageWithAI extends IMessage {
	ai_flagged?: boolean;
	ai_flag_reason?: string;
	ai_flag_confidence?: number;
}

const Dep = new Tracker.Dependency();

async function verifyMessageContent(message: string, user?: IUser, room?: IRoom): Promise<IAIVerificationResult> {
	try {
		const aiConfig: IAIConfig = {
			apiUrl: settings.get('AI_Content_Verification_API_URL') as string,
			apiKey: settings.get('AI_Content_Verification_API_Key') as string,
			timeout: (settings.get('AI_Content_Verification_Timeout') as number) || 5000,
			threshold: (settings.get('AI_Content_Verification_Threshold') as number) || 0.8,
		};

		if (!aiConfig.apiUrl || !aiConfig.apiKey) {
			SystemLogger.warn('AI Content Verification: API URL or Key not configured, skipping verification');
			return { approved: true, reason: 'Configuration missing' };
		}

		const requestData = {
			message,
		};

		try {
			const response = await fetch(aiConfig.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${aiConfig.apiKey}`,
					'User-Agent': 'RocketChat-AI-Verification/6.4.7',
				},
				body: JSON.stringify(requestData),
				timeout: aiConfig.timeout,
			});

			if (!response.ok) {
				SystemLogger.error(`AI Content Verification API error: ${response.status} ${response.statusText}`);
				return { approved: true, reason: 'API Error - defaulting to approve' };
			}

			const responseData = await response.json();

			SystemLogger.info(`Received status is: ${responseData.status}`);

			let reason: string | undefined;
			if (responseData.status === 'rejected') {
				reason = 'Message content rejected by AI verification';
			} else if (responseData.status !== 'approved') {
				reason = `API returned unexpected status: ${responseData.status}`;
			}

			// Dostosowanie do nowego formatu mock API Postmana
			const result: IAIVerificationResult = {
				approved: responseData.status === 'approved',
				reason,
				confidence: responseData.confidence,
				detectedCategories: responseData.categories,
				suggestions: responseData.suggestions,
			};

			// Logowanie wyniku weryfikacji
			if (!result.approved) {
				SystemLogger.info(`AI Content Verification: Message blocked - ${result.reason}`, {
					user: user?.username,
					room: room?.name,
					confidence: result.confidence,
					categories: result.detectedCategories,
					suggestions: result.suggestions,
				});
			}

			return result;
		} catch (error: unknown) {
			SystemLogger.error('AI Content Verification: Request failed', error);

			// W przypadku błędu, domyślnie approve (fail-safe)
			return { approved: true, reason: 'Verification failed - defaulting to approve' };
		}
	} catch (error: unknown) {
		SystemLogger.error('AI Content Verification: Unexpected error', error);
		return { approved: true, reason: 'Unexpected error - defaulting to approve' };
	}
}

Meteor.startup(() => {
	settings.watchMultiple(
		[
			'AI_Content_Verification_Enabled',
			'AI_Content_Verification_API_URL',
			'AI_Content_Verification_API_Key',
			'AI_Content_Verification_Timeout',
			'AI_Content_Verification_Threshold',
			'AI_Content_Verification_Block_Mode',
			'AI_Content_Verification_Whitelist_Roles',
		],
		() => {
			Dep.changed();
		},
	);

	Tracker.autorun(() => {
		Dep.depend();
		const isEnabled = settings.get('AI_Content_Verification_Enabled') as boolean;

		callbacks.remove('beforeSaveMessage', 'aiContentVerification');

		if (!isEnabled) {
			SystemLogger.info('AI Content Verification: Disabled');
			return;
		}

		const blockMode = (settings.get('AI_Content_Verification_Block_Mode') as string) || 'block';
		const whitelistRoles = (settings.get('AI_Content_Verification_Whitelist_Roles') as string) || '';
		const whitelistRolesList = whitelistRoles
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean);

		SystemLogger.info('AI Content Verification: Enabled', {
			blockMode,
			whitelistRoles: whitelistRolesList,
		});

		callbacks.add(
			'beforeSaveMessage',
			async (message: IMessage, room?: IRoom): Promise<IMessage> => {
				if (!message.msg || message.msg.trim() === '') {
					return message;
				}

				if (message.t) {
					return message;
				}

				const user = message.u as IUser;

				if (whitelistRolesList.length > 0 && user?.roles) {
					const hasWhitelistRole = user.roles.some((role) => whitelistRolesList.includes(role));
					if (hasWhitelistRole) {
						return message;
					}
				}

				try {
					const verificationResult = await verifyMessageContent(message.msg, user, room);

					if (!verificationResult.approved) {
						if (blockMode === 'block') {
							throw new Meteor.Error('message-blocked-by-ai', verificationResult.reason || 'Message blocked by AI content verification', {
								method: 'aiContentVerification',
								confidence: verificationResult.confidence,
								categories: verificationResult.detectedCategories,
								suggestions: verificationResult.suggestions,
							});
						} else if (blockMode === 'modify') {
							message.msg = '[Message blocked by AI content verification]';
							return message;
						} else if (blockMode === 'flag') {
							const messageWithAI = message as IMessageWithAI;
							messageWithAI.ai_flagged = true;
							messageWithAI.ai_flag_reason = verificationResult.reason;
							messageWithAI.ai_flag_confidence = verificationResult.confidence;
							return messageWithAI;
						}
					}

					return message;
				} catch (error) {
					if (!(error instanceof Meteor.Error)) {
						SystemLogger.error('AI Content Verification: Callback error', error);
					}
					throw error;
				}
			},
			callbacks.priority.HIGH,
			'aiContentVerification',
		);
	});
});

export { verifyMessageContent };
