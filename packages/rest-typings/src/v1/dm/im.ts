type DmKickProps = {
	roomId: string;
};

// Every other /v1/im.* route is typed by its migrated implementation
// (apps/meteor/server/api/v1/im.ts) via ExtractRoutesFromAPI; im.kick is
// still registered through the legacy API.v1.addRoute.
export type ImEndpoints = {
	'/v1/im.kick': {
		POST: (params: DmKickProps) => void;
	};
};
