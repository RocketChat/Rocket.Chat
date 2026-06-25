import { API } from '../../../../../app/api/server';

export type McpMethod = 'get' | 'post' | 'put' | 'delete';

export type McpTool = {
	/** MCP tool name exposed to the client (must match ^[a-zA-Z0-9_-]{1,64}$). */
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	/** Internal: the REST route this tool maps to. */
	path: string;
	method: McpMethod;
};

/**
 * Minimal default toolset (exposed when the extended set is off). Each entry points at an
 * existing REST endpoint; the input schema and (where present) description are reused from
 * the route's typed metadata. `fallbackDescription` covers legacy endpoints with no
 * request schema (e.g. `channels.create`), which the extended allow-list excludes.
 */
const CURATED: { name: string; path: string; method: McpMethod; fallbackDescription?: string }[] = [
	{ name: 'chat_postMessage', path: '/api/v1/chat.postMessage', method: 'post' },
	{ name: 'chat_getMessage', path: '/api/v1/chat.getMessage', method: 'get' },
	{
		name: 'channels_create',
		path: '/api/v1/channels.create',
		method: 'post',
		fallbackDescription: 'Create a public channel. Requires `name`; optional `members` (array of usernames).',
	},
	{
		name: 'channels_list_joined',
		path: '/api/v1/channels.list.joined',
		method: 'get',
		fallbackDescription: 'List the public channels the authenticated user has joined.',
	},
	{
		name: 'rooms_get',
		path: '/api/v1/rooms.get',
		method: 'get',
		fallbackDescription: 'List rooms the authenticated user has access to (optionally updated since a timestamp).',
	},
	{ name: 'users_info', path: '/api/v1/users.info', method: 'get' },
];

/**
 * Allow-list for the *extended* toolset, expressed as the base tool name per route — i.e.
 * the `toolNameFor(path, method)` value, WITHOUT any `_by_<discriminator>` variant suffix.
 * Matched at the route level, so a single entry (e.g. `get_users_info`) exposes every
 * variant of that route (`get_users_info_by_userId`, `_by_username`, …).
 *
 * The extended set is the full catalog filtered by these names — the entire API is never
 * exposed.
 */
const ALLOWED_TOOL_NAMES = new Set<string>([
	// chat — reading
	'get_chat_getDiscussions',
	'get_chat_getMentionedMessages',
	'get_chat_getMessage',
	'get_chat_getPinnedMessages',
	'get_chat_getStarredMessages',
	'get_chat_getThreadMessages',
	'get_chat_getThreadsList',
	'get_chat_search',
	'get_chat_syncMessages',
	'get_chat_syncThreadMessages',
	'get_chat_syncThreadsList',
	// custom user status
	'get_custom_user_status_list',
	// direct messages — reading
	'get_dm_files',
	'get_dm_history',
	'get_dm_list',
	'get_dm_list_everyone',
	'get_dm_members',
	'get_dm_messages',
	'get_dm_messages_others',
	// me
	'get_me',
	// rooms — reading
	'get_rooms_autocomplete_availableForTeams',
	'get_rooms_autocomplete_channelAndPrivate',
	'get_rooms_get',
	'get_rooms_getDiscussions',
	'get_rooms_info',
	'get_rooms_isMember',
	'get_rooms_membersOrderedByRole',
	'get_rooms_nameExists',
	// search
	'get_spotlight',
	// subscriptions — reading
	'get_subscriptions_get',
	'get_subscriptions_getOne',
	// teams — reading
	'get_teams_autocomplete',
	'get_teams_info',
	'get_teams_list',
	'get_teams_listAll',
	'get_teams_listChildren',
	'get_teams_listRooms',
	'get_teams_listRoomsOfUser',
	'get_teams_members',
	// users — reading
	'get_users_autocomplete',
	'get_users_checkUsernameAvailability',
	'get_users_getPreferences',
	'get_users_getPresence',
	'get_users_getStatus',
	'get_users_info',
	'get_users_listTeams',
	// chat — writing
	// 'post_chat_delete',
	'post_chat_followMessage',
	'post_chat_pinMessage',
	'post_chat_postMessage',
	'post_chat_react',
	'post_chat_reportMessage',
	'post_chat_sendMessage',
	'post_chat_starMessage',
	'post_chat_unfollowMessage',
	'post_chat_unPinMessage',
	'post_chat_unStarMessage',
	'post_chat_update',
	// custom user status — writing
	'post_custom_user_status_create',
	// 'post_custom_user_status_delete',
	'post_custom_user_status_update',
	// direct messages — writing
	'post_dm_close',
	'post_dm_create',
	// 'post_dm_delete',
	'post_dm_open',
	'post_dm_setTopic',
	'post_im_blockUser',
	// rooms — writing
	'post_rooms_banUser',
	'post_rooms_changeArchivationState',
	'post_rooms_createDiscussion',
	// 'post_rooms_delete',
	'post_rooms_favorite',
	'post_rooms_hide',
	'post_rooms_invite',
	'post_rooms_join',
	'post_rooms_leave',
	'post_rooms_muteUser',
	'post_rooms_open',
	'post_rooms_saveRoomSettings',
	'post_rooms_unbanUser',
	'post_rooms_unmuteUser',
	// subscriptions — writing
	'post_subscriptions_read',
	'post_subscriptions_unread',
	// teams — writing
	'post_teams_addMembers',
	'post_teams_addRooms',
	'post_teams_convertToChannel',
	'post_teams_create',
	// 'post_teams_delete',
	'post_teams_leave',
	'post_teams_removeMember',
	'post_teams_removeRoom',
	'post_teams_update',
	'post_teams_updateMember',
	'post_teams_updateRoom',
	// uploads
	// 'post_uploads_delete',
	// users — writing
	'post_users_create',
	'post_users_register',
	'post_users_setStatus',
	'post_users_update',
	'post_users_updateOwnBasicInfo',
]);

const FALLBACK_SCHEMA: Record<string, unknown> = { type: 'object', additionalProperties: true };

const COMBINATOR_KEYS = ['oneOf', 'anyOf', 'allOf'] as const;

/**
 * Transform a route's JSON Schema into one accepted by MCP clients / the Anthropic tools
 * API, which require a plain object schema and reject combinator keywords:
 *  - strip OpenAPI-only `nullable` (not valid JSON Schema 2020-12) and `not`,
 *  - resolve `oneOf`/`anyOf`/`allOf` by adopting the FIRST branch. For a schema built as
 *    `{ oneOf: [subSchemaA, subSchemaB] }` this means the MCP tool uses one named
 *    sub-schema (e.g. post-by-channel); for a bare value union like `string | string[]`
 *    it keeps a concrete type. The REST layer still enforces the full rule on dispatch,
 *    so this only shapes the advertised tool schema — the validator is untouched.
 */
const mcpSafeSchema = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(mcpSafeSchema);
	}
	if (!value || typeof value !== 'object') {
		return value;
	}

	let node: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
		if (key === 'nullable' || key === 'not') {
			continue;
		}
		node[key] = val;
	}

	const combinator = COMBINATOR_KEYS.find((key) => Array.isArray(node[key]) && (node[key] as unknown[]).length > 0);
	if (combinator) {
		const firstBranch = mcpSafeSchema((node[combinator] as unknown[])[0]) as Record<string, unknown>;
		for (const key of COMBINATOR_KEYS) {
			delete node[key];
		}
		// The first branch supplies the structure (type/properties/required); this node's
		// own keys (e.g. a top-level `description`) win on top.
		node = { ...firstBranch, ...node };
	}

	if (node.properties && typeof node.properties === 'object') {
		node.properties = Object.fromEntries(
			Object.entries(node.properties as Record<string, unknown>).map(([key, val]) => [key, mcpSafeSchema(val)]),
		);
	}
	if (node.items) {
		node.items = mcpSafeSchema(node.items);
	}

	return node;
};

const ensureObjectSchema = (schema: unknown): Record<string, unknown> => {
	if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
		return FALLBACK_SCHEMA;
	}
	const obj = mcpSafeSchema(schema) as Record<string, unknown>;
	return obj.type === 'object' ? obj : { ...obj, type: 'object' };
};

/** Pull the raw request JSON-Schema for a route (the main schema, before flattening). */
const rawSchemaForRoute = (path: string, method: McpMethod): unknown => {
	const route = API.api.typedRoutes?.[path]?.[method];
	if (!route) {
		return undefined;
	}
	return method === 'post' || method === 'put' ? route.requestBody?.content?.['application/json']?.schema : route.parameters?.[0]?.schema;
};

const VARIANT_KEYS = ['oneOf', 'anyOf'] as const;

/** A branch's discriminator = its `required` keys (e.g. `channel`, `roomId`, `userId`). */
const discriminatorOf = (schema: Record<string, unknown>): string | undefined => {
	const { required } = schema;
	if (Array.isArray(required) && required.length > 0 && required.every((r) => typeof r === 'string')) {
		return required.join('_');
	}
	return undefined;
};

type SchemaVariant = { discriminator?: string; description?: string; schema: Record<string, unknown> };

/**
 * Split a route's request schema into MCP-ready variants. When the schema is a
 * `oneOf`/`anyOf` of object sub-schemas with distinct discriminators (e.g.
 * post-by-channel vs post-by-roomId), each becomes its own variant; otherwise a single
 * flattened object schema is returned.
 */
const variantsForRoute = (path: string, method: McpMethod): SchemaVariant[] => {
	const raw = rawSchemaForRoute(path, method);

	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		const root = raw as Record<string, unknown>;
		const key = VARIANT_KEYS.find((k) => Array.isArray(root[k]) && (root[k] as unknown[]).length > 1);
		if (key) {
			const mainDescription = typeof root.description === 'string' ? root.description : undefined;
			const branches = (root[key] as unknown[]).map(ensureObjectSchema);
			const discriminators = branches.map(discriminatorOf);
			const allDistinct = discriminators.every(Boolean) && new Set(discriminators).size === discriminators.length;
			if (allDistinct) {
				return branches.map((schema, i) => ({
					discriminator: discriminators[i],
					description: typeof schema.description === 'string' ? schema.description : mainDescription,
					schema,
				}));
			}
		}
	}

	const schema = ensureObjectSchema(raw);
	return [{ description: typeof schema.description === 'string' ? schema.description : undefined, schema }];
};

/** Expand a single route into one MCP tool per request variant. */
const toolsForRoute = (baseName: string, path: string, method: McpMethod, fallbackDescription?: string): McpTool[] =>
	variantsForRoute(path, method).map((variant) => ({
		name: (variant.discriminator ? `${baseName}_by_${variant.discriminator}` : baseName).slice(0, 64),
		description: variant.description ?? fallbackDescription ?? `${method.toUpperCase()} ${path}`,
		path,
		method,
		inputSchema: variant.schema,
	}));

/** Build a valid MCP tool name base from a route path + method. */
const toolNameFor = (path: string, method: McpMethod): string => {
	const slug = path.replace(/^\/api\/v\d+\//, '').replace(/[^a-zA-Z0-9]+/g, '_');
	return `${method}_${slug}`.slice(0, 64);
};

/**
 * Walk the documented routes (excluding `Missing Documentation`, mirroring the OpenAPI
 * filter) and emit one or more tools per route, keeping only routes whose base tool name
 * passes `isRouteAllowed`. The filter is applied to the base name, so all `_by_` variants
 * of an allowed route are included together.
 */
const collectTools = (isRouteAllowed: (baseName: string) => boolean): McpTool[] => {
	const tools: McpTool[] = [];

	for (const [path, methods] of Object.entries(API.api.typedRoutes ?? {})) {
		for (const [method, route] of Object.entries(methods)) {
			if (route?.tags?.includes('Missing Documentation')) {
				continue;
			}
			if (!['get', 'post', 'put', 'delete'].includes(method)) {
				continue;
			}
			const baseName = toolNameFor(path, method as McpMethod);
			if (!isRouteAllowed(baseName)) {
				continue;
			}
			const fallback = route?.tags?.length
				? `${method.toUpperCase()} ${path} (${route.tags.join(', ')})`
				: `${method.toUpperCase()} ${path}`;
			tools.push(...toolsForRoute(baseName, path, method as McpMethod, fallback));
		}
	}

	return tools;
};

/** The minimal default toolset — the hand-picked {@link CURATED} routes. */
export const getCuratedTools = (): McpTool[] =>
	CURATED.filter(({ path, method }) => Boolean(API.api.typedRoutes?.[path]?.[method])).flatMap(
		({ name, path, method, fallbackDescription }) => toolsForRoute(name, path, method, fallbackDescription),
	);

/**
 * The extended toolset — the full catalog filtered by {@link ALLOWED_TOOL_NAMES}. The
 * entire API is never exposed; routes outside the allow-list (and `Missing Documentation`
 * routes) are excluded.
 */
export const getExtendedTools = (): McpTool[] => collectTools((baseName) => ALLOWED_TOOL_NAMES.has(baseName));
