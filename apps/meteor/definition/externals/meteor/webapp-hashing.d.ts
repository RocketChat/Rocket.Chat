declare module 'meteor/webapp-hashing' {
	namespace WebAppHashing {
		function calculateClientHash(manifest: Record<string, any>, includeFilter: Function, runtimeConfigOverride: any): string;
	}
}
