// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DefaultEndpoints {
	'/info': {
		GET: () => {
			info: {
				build: {
					arch: string;
					cpus: number;
					date: string;
					freeMemory: number;
					nodeVersion: string;
					osRelease: string;
					platform: string;
					totalMemory: number;
				};
				commit: {
					author?: string;
					branch?: string;
					date?: string;
					hash?: string;
					subject?: string;
					tag?: string;
				};
				marketplaceApiVersion: string;
				version: string;
				tag?: string;
				branch?: string;
			};
			supportedVersions?: { signed: string };
			minimumClientVersions: {
				desktop: string;
				mobile: string;
			};
			version: string | undefined;
		};
	};
	'/ecdh_proxy/initEncryptedSession': {
		POST: () => void;
	};
}
