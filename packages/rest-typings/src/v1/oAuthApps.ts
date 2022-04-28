import type { IOAuthApps } from "@rocket.chat/core-typings";

export type OAuthAppsEndpoints = {
    'oauth-apps.list': {
        GET: () => {
            oauthApps: IOAuthApps[];
        };
    };
    'oauth-apps.get': {
        GET: (params: { appId: string }) => {
            oauthApp: IOAuthApps;
        };
    };
};
