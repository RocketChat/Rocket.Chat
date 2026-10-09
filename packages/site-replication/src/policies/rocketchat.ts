import type { CollectionPolicy } from '../types';

export const ROCKETCHAT_MESSAGES = 'rocketchat_message';

/** Settings that describe one site's own infrastructure rather than the workspace. */
export const DEFAULT_LOCAL_SETTINGS = ['FileUpload_S3_BucketURL', 'FileUpload_S3_Region', 'FileUpload_S3_CDN'];

/**
 * The Rocket.Chat collections that make up the shared workspace. Presence connections, instance
 * registrations, sessions, jobs and omnichannel stay with each site.
 */
export const rocketChatPolicies = ({ localSettings = DEFAULT_LOCAL_SETTINGS }: { localSettings?: string[] } = {}): CollectionPolicy[] => [
	{
		name: 'users',
		sets: ['services.resume.loginTokens', 'roles'],
		unique: [{ fields: ['username'], sparse: true, onConflict: { kind: 'rename', fields: ['username'] } }],
	},
	{
		name: 'rocketchat_room',
		counters: ['msgs', 'usersCount'],
		sets: ['muted', 'unmuted'],
		unique: [
			{
				fields: ['name'],
				sparse: true,
				onConflict: {
					kind: 'rename',
					fields: ['name', 'fname'],
					dependents: [{ coll: 'rocketchat_subscription', foreignKey: 'rid', fields: { name: 'name', fname: 'fname' } }],
				},
			},
		],
	},
	{
		name: 'rocketchat_subscription',
		counters: ['unread', 'userMentions', 'groupMentions'],
		sets: ['tunread', 'tunreadUser', 'tunreadGroup'],
		unique: [{ fields: ['rid', 'u._id'], onConflict: { kind: 'merge' } }],
	},
	{
		name: ROCKETCHAT_MESSAGES,
		counters: ['tcount'],
		sets: ['replies', 'reactions.*.usernames', 'reactions.*.names', 'starred'],
	},
	{ name: 'rocketchat_message_reads', unique: [{ fields: ['tmid', 'userId'], onConflict: { kind: 'merge' } }] },
	{ name: 'rocketchat_uploads' },
	{ name: 'rocketchat_avatars' },
	{ name: 'rocketchat_settings', localIds: localSettings },
	{ name: 'rocketchat_permissions', sets: ['roles'] },
	{ name: 'rocketchat_roles' },
	{ name: 'rocketchat_team', unique: [{ fields: ['name'], onConflict: { kind: 'record' } }] },
	{ name: 'rocketchat_team_member', unique: [{ fields: ['teamId', 'userId'], onConflict: { kind: 'merge' } }] },
	{ name: 'rocketchat_custom_emoji' },
	{ name: 'rocketchat_custom_user_status' },
	{ name: 'rocketchat_custom_sounds' },
	{ name: 'rocketchat_integrations' },
	{ name: 'rocketchat_invites' },
	{ name: 'rocketchat__trash' },
];
