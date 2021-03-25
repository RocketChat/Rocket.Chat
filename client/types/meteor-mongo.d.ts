declare module 'meteor/mongo' {
	namespace Mongo {
		// eslint-disable-next-line @typescript-eslint/interface-name-prefix
		interface CollectionStatic {
			new <T>(name: string | null, options?: {
				connection?: object | null;
				idGeneration?: string;
				transform?: Function | null;
			}): Collection<T>;
		}
	}
}
