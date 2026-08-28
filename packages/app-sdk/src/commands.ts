/**
 * Slash commands.
 *
 * Legacy `ISlashCommand` gives you `context.getArguments(): string[]` — you
 * hand-split and validate the raw tokens yourself, every time — and a five-arg
 * `executor(context, read, modify, http, persis)` signature.
 *
 * The SDK declares command arguments as a **schema**. The runtime tokenizes the
 * raw input (positional fields in declaration order, plus `--flag value` for
 * named fields), coerces and validates it against the schema, and hands you a
 * typed `ctx.args`. A validation failure is reported to the user by the runtime
 * before your `run` executes. The raw tokens remain available as `ctx.rawArgs`.
 */

import type { AppContext, AppEnv, BaseEnv } from './context';
import type { MessageId, RoomId, UiBlock, UserId } from './models';
import type { InferArg, Schema } from './schema';

export interface SlashCommandContext<Env extends AppEnv, TArgs> extends AppContext<Env> {
	readonly command: string;
	/** Parsed + validated arguments (typed by the `arguments` schema). */
	readonly args: TArgs;
	/** Raw token escape hatch, equivalent to legacy `getArguments()`. */
	readonly rawArgs: string[];
	readonly room: RoomId;
	readonly sender: UserId;
	readonly threadId?: MessageId;
	/** Present when the invocation can open interactive surfaces. */
	readonly triggerId?: string;
}

type ArgsOf<A> = InferArg<A, string[]>;

export interface SlashCommandPreviewItem {
	id: string;
	type: 'image' | 'text';
	value: string;
}

export interface SlashCommandDef<Env extends AppEnv, A extends Schema | undefined> {
	command: string;
	i18nDescription: string;
	i18nParamsExample?: string;
	/** Permission the invoker must hold (from the app's declared permissions). */
	permission?: string;
	/** Schema describing the command's arguments. Omit for raw `string[]` args. */
	arguments?: A;
	run(ctx: SlashCommandContext<Env, ArgsOf<A>>): Promise<void>;
	/** Optional typeahead preview (replaces previewer/executePreviewItem pair). */
	preview?: {
		render(ctx: SlashCommandContext<Env, ArgsOf<A>>): Promise<SlashCommandPreviewItem[]>;
		onSelect(item: SlashCommandPreviewItem, ctx: SlashCommandContext<Env, ArgsOf<A>>): Promise<void>;
	};
}

/** Discriminant marker so `defineApp` can validate/route definitions. */
export const SLASH_COMMAND = Symbol.for('rc.app-sdk.slashCommand');

export type SlashCommand<Env extends AppEnv = AppEnv, A extends Schema | undefined = Schema | undefined> = SlashCommandDef<Env, A> & {
	readonly [SLASH_COMMAND]: true;
};

/**
 * Define a slash command. Identity factory: returns the (branded) definition
 * unchanged after light validation, so authoring mistakes surface at import
 * time — the same ergonomics as Mastra's `createTool` / `defineSchedule`.
 */
export function defineSlashCommand<A extends Schema | undefined = undefined, Env extends AppEnv = BaseEnv>(
	def: SlashCommandDef<Env, A>,
): SlashCommand<Env, A> {
	if (!def.command || /\s/.test(def.command)) {
		throw new Error(`defineSlashCommand: "command" must be a non-empty single token (got ${JSON.stringify(def.command)})`);
	}
	return { ...def, [SLASH_COMMAND]: true };
}

export type { UiBlock };
