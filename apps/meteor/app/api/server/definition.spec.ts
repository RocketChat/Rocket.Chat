import type { IUser } from '@rocket.chat/core-typings';
import type { ValidateFunction } from 'ajv';

import type { TypedThis, TypedOptions, Action, InnerAction } from './definition';

// --- Utilities ---
type IsTypeEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type ExtractThis<T> = T extends (this: infer U, ...args: any[]) => any ? U : never;
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// --- Scenario: POST /v1/chat.postMessage ---
interface IChatPostMessageBody {
	channal: string;
	text: string;
}
type ChatPostMessageBodyValidator = ValidateFunction<IChatPostMessageBody>;

type ChatPostMessageOptions = TypedOptions & {
	body: ChatPostMessageBodyValidator;
	authRequired: true;
};

type Post = 'POST';
type Path = '/v1/chat.postMessage';
type Options = ChatPostMessageOptions;

// --- Expected ActionThis shape (single source of truth) ---
type ExpectedActionThis = {
	route: string;
	readonly requestIp: string;
	urlParams: never;
	readonly response: Response;
	readonly queryParams: Record<string, string>;
	readonly bodyParams: IChatPostMessageBody;
	readonly request: Request;
	readonly queryOperations: never;
	parseJsonQuery: () => Promise<{
		sort: Record<string, 1 | -1>;
		fields: Record<string, 0 | 1>;
		query: Record<string, unknown>;
	}>;
	readonly connection: {
		token: string;
		id: string;
		close: () => void;
		clientAddress: string;
		httpHeaders: Record<string, any>;
	};
	user: IUser;
	userId: string;
	readonly token: string;
};

// --- Type-level assertions ---
type ChatPostMessageThis = TypedThis<Options, Path>;
type TestChatPostMessageBodyParams = IsTypeEqual<ChatPostMessageThis['bodyParams'], IChatPostMessageBody>;
true satisfies TestChatPostMessageBodyParams;

type ActionType = Action<Post, Path, Options>;
type ActionThisType = ExtractThis<Exclude<ActionType, undefined>>;
type TestActionBodyParams = IsTypeEqual<ActionThisType['bodyParams'], ExpectedActionThis['bodyParams']>;
true satisfies TestActionBodyParams;

type InnerActionType = InnerAction<Post, Path, Options>;
type ExpectedInnerActionThis = Mutable<ExpectedActionThis>;
type InnerActionThisType = ExtractThis<Exclude<InnerActionType, undefined>>;
type TestInnerActionBodyParams = IsTypeEqual<InnerActionThisType['bodyParams'], ExpectedInnerActionThis['bodyParams']>;
true satisfies TestInnerActionBodyParams;
