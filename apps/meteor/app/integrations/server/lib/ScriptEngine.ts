import type {
	IUser,
	IRoom,
	IMessage,
	IOutgoingIntegration,
	IIncomingIntegration,
	IIntegration,
	IIntegrationHistory,
} from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import type { serverFetch } from '@rocket.chat/server-fetch';
import { wrapExceptions } from '@rocket.chat/tools';

import { incomingLogger, outgoingLogger } from '../logger';
import type { IScriptClass, CompiledScript } from './definition';
import { updateHistory } from './updateHistory';

type OutgoingRequestBaseData = {
	token: IOutgoingIntegration['token'];
	bot: false;
	trigger_word: string;
};

type OutgoingRequestSendMessageData = OutgoingRequestBaseData & {
	channel_id: string;
	channel_name: string;
	message_id: string;
	timestamp: Date;
	user_id: string;
	user_name: string;
	text: string;
	siteUrl: string;
	alias?: string;
	bot?: boolean;
	isEdited?: true;
	tmid?: string;
};

type OutgoingRequestUploadedFileData = OutgoingRequestBaseData & {
	channel_id: string;
	channel_name: string;
	message_id: string;
	timestamp: Date;
	user_id: string;
	user_name: string;
	text: string;

	user: IUser;
	room: IRoom;
	message: IMessage;

	alias?: string;
	bot?: boolean;
};

type OutgoingRequestRoomCreatedData = OutgoingRequestBaseData & {
	channel_id: string;
	channel_name: string;
	timestamp: Date;
	user_id: string;
	user_name: string;
	owner: IUser;
	room: IRoom;
};

type OutgoingRequestRoomData = OutgoingRequestBaseData & {
	channel_id: string;
	channel_name: string;
	timestamp: Date;
	user_id: string;
	user_name: string;
	owner: IUser;
	room: IRoom;
	bot?: boolean;
};

type OutgoingRequestUserCreatedData = OutgoingRequestBaseData & {
	timestamp: Date;
	user_id: string;
	user_name: string;
	user: IUser;
	bot?: boolean;
};

type OutgoingRequestData =
	| OutgoingRequestSendMessageData
	| OutgoingRequestUploadedFileData
	| OutgoingRequestRoomCreatedData
	| OutgoingRequestRoomData
	| OutgoingRequestUserCreatedData;

type OutgoingRequest = {
	params: Record<never, never>;
	method: 'POST';
	url: string;
	data: OutgoingRequestData;
	auth: undefined;
	headers: Record<string, string>;
};

type OutgoingRequestFromScript = {
	url?: string;
	headers?: Record<string, string>;
	method?: string;
	message?: {
		text?: string;
		channel?: string;
		attachments?: {
			color?: string;
			author_name?: string;
			author_link?: string;
			author_icon?: string;
			title?: string;
			title_link?: string;
			text?: string;
			fields?: {
				title?: string;
				value?: string;
				short?: boolean;
			}[];
			image_url?: string;
			thumb_url?: string;
		}[];
	};

	auth?: string;
	data?: Record<string, any>;
};

type OutgoingRequestContext = {
	integration: IOutgoingIntegration;
	data: OutgoingRequestData;
	historyId: IIntegrationHistory['_id'];
	url: string;
};

type ProcessedOutgoingRequest = OutgoingRequest | OutgoingRequestFromScript;

type OutgoingResponseContext = {
	integration: IOutgoingIntegration;
	request: ProcessedOutgoingRequest;
	response: Awaited<ReturnType<typeof serverFetch>>;
	content: string;
	historyId: IIntegrationHistory['_id'];
};

type IncomingIntegrationRequest = {
	url: {
		hash: string | null | undefined;
		search: string | null | undefined;
		query: Record<string, any>;
		pathname: string | null | undefined;
		path: string | null | undefined;
	};
	url_raw: string;
	url_params: Record<string, string>;
	content: Record<string, any>;
	content_raw: string;
	headers: Record<string, string>;
	body: Record<string, any>;
	user: Pick<Required<IUser>, '_id' | 'name' | 'username'>;
};

export abstract class IntegrationScriptEngine<IsIncoming extends boolean> {
	protected compiledScripts: Record<IIntegration['_id'], CompiledScript>;

	public get disabled(): boolean {
		return this.isDisabled();
	}

	public get incoming(): IsIncoming {
		return this.isIncoming;
	}

	constructor(private isIncoming: IsIncoming) {
		this.compiledScripts = {};
	}

	public integrationHasValidScript(integration: IIntegration): boolean {
		return Boolean(!this.disabled && integration.scriptEnabled && integration.scriptCompiled && integration.scriptCompiled.trim() !== '');
	}

	// PrepareOutgoingRequest will execute a script to build the request object that will be used for the actual integration request
	// It may also return a message object to be sent to the room where the integration was triggered
	public async prepareOutgoingRequest({ integration, data, historyId, url }: OutgoingRequestContext): Promise<ProcessedOutgoingRequest> {
		const request: OutgoingRequest = {
			params: {},
			method: 'POST',
			url,
			data,
			auth: undefined,
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36',
			},
		};

		if (!(await this.hasScriptAndMethod(integration, 'prepare_outgoing_request'))) {
			return request;
		}

		return this.executeOutgoingScript(integration, 'prepare_outgoing_request', { request }, historyId);
	}

	public async processOutgoingResponse({
		integration,
		request,
		response,
		content,
		historyId,
	}: OutgoingResponseContext): Promise<string | false | undefined> {
		if (!(await this.hasScriptAndMethod(integration, 'process_outgoing_response'))) {
			return;
		}

		const sandbox = {
			request,
			response: {
				error: null,
				status_code: response.status,
				content,
				content_raw: content,
				headers: Object.fromEntries(response.headers),
			},
		};

		const scriptResult = await this.executeOutgoingScript(integration, 'process_outgoing_response', sandbox, historyId);

		if (scriptResult === false) {
			return scriptResult;
		}

		if (scriptResult?.content) {
			return scriptResult.content;
		}
	}

	public async processIncomingRequest({
		integration,
		request,
	}: {
		integration: IIncomingIntegration;
		request: IncomingIntegrationRequest;
	}): Promise<any> {
		return this.executeIncomingScript(integration, 'process_incoming_request', { request });
	}

	protected get logger(): ReturnType<Logger['section']> {
		if (this.isIncoming) {
			return incomingLogger;
		}

		return outgoingLogger;
	}

	protected async executeOutgoingScript(
		integration: IOutgoingIntegration,
		method: keyof IScriptClass,
		params: Record<string, any>,
		historyId: IIntegrationHistory['_id'],
	): Promise<any> {
		if (this.disabled) {
			return;
		}

		const script = await wrapExceptions(() => this.getIntegrationScript(integration)).suppress((e: any) =>
			updateHistory({
				historyId,
				step: 'execute-script-getting-script',
				error: true,
				errorStack: e,
			}),
		);

		if (!script) {
			return;
		}

		if (!script[method]) {
			this.logger.error(`Method "${method}" not found in the Integration "${integration.name}"`);
			await updateHistory({ historyId, step: `execute-script-no-method-${method}` });
			return;
		}

		try {
			await updateHistory({ historyId, step: `execute-script-before-running-${method}` });

			const result = await this.runScriptMethod({
				integrationId: integration._id,
				script,
				method,
				params,
			});

			this.logger.debug({
				msg: `Script method "${method}" result of the Integration "${integration.name}" is:`,
				result,
			});

			return result;
		} catch (err: any) {
			await updateHistory({
				historyId,
				step: `execute-script-error-running-${method}`,
				error: true,
				errorStack: err.stack.replace(/^/gm, '  '),
			});
			this.logger.error({
				msg: 'Error running Script in the Integration',
				integration: integration.name,
				err,
			});
			this.logger.debug({
				msg: 'Error running Script in the Integration',
				integration: integration.name,
				script: integration.scriptCompiled,
			});
		}
	}

	protected async executeIncomingScript(
		integration: IIncomingIntegration,
		method: keyof IScriptClass,
		params: Record<string, any>,
	): Promise<any> {
		if (!this.integrationHasValidScript(integration)) {
			return;
		}

		const script = await wrapExceptions(() => this.getIntegrationScript(integration)).catch((e) => {
			this.logger.error(e);
			throw e;
		});

		if (!script[method]) {
			this.logger.error(`Method "${method}" not found in the Integration "${integration.name}"`);
			return;
		}

		return wrapExceptions(() =>
			this.runScriptMethod({
				integrationId: integration._id,
				script,
				method,
				params,
			}),
		).catch((err: any) => {
			this.logger.error({
				msg: 'Error running Script in Trigger',
				integration: integration.name,
				script: integration.scriptCompiled,
				err,
			});
			throw new Error('error-running-script');
		});
	}

	protected async hasScriptAndMethod(integration: IIntegration, method: keyof IScriptClass): Promise<boolean> {
		const script = await this.getScriptSafely(integration);
		return typeof script?.[method] === 'function';
	}

	protected async getScriptSafely(integration: IIntegration): Promise<Partial<IScriptClass> | undefined> {
		if (this.disabled || integration.scriptEnabled !== true || !integration.scriptCompiled || integration.scriptCompiled.trim() === '') {
			return;
		}

		return wrapExceptions(() => this.getIntegrationScript(integration)).suppress();
	}

	protected abstract isDisabled(): boolean;

	protected abstract runScriptMethod({
		integrationId,
		script,
		method,
		params,
	}: {
		integrationId: IIntegration['_id'];
		script: IScriptClass;
		method: keyof IScriptClass;
		params: Record<string, any>;
	}): Promise<any>;

	protected abstract getIntegrationScript(integration: IIntegration): Promise<Partial<IScriptClass>>;
}
