import type { ImEndpoints } from './im';
// All /v1/dm.* routes are typed by their migrated implementations
// (apps/meteor/server/api/v1/im.ts) via ExtractRoutesFromAPI.
export type DmEndpoints = {
	// Type-migration pending: the ExtractRoutesFromAPI emit for this route is
	// weaker than this declaration (see the Omit in the meteor augmentation).
	'/v1/dm.files': ImEndpoints['/v1/im.files'];
	'/v1/dm.members': ImEndpoints['/v1/im.members'];
};
