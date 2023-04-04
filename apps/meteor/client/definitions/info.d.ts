declare module '*.info' {
	export const Info: {
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
}
