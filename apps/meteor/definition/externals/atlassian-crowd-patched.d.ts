declare module 'atlassian-crowd-patched' {
	type Callback<T> = (err: any, result: T) => void;

	class AtlassianCrowd {
		constructor(options: Record<string, unknown>);

		ping(callback: (err: any) => void): void;

		search(entity: string, restriction: string, callback: Callback<Record<string, any>>): void;

		user: {
			find(username: string, callback: Callback<Record<string, any>>): void;
			authenticate(username: string, password: string, callback: Callback<Record<string, any>>): void;
		};
	}

	export = AtlassianCrowd;
}
