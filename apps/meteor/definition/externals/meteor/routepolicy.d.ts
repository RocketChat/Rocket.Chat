declare module 'meteor/routepolicy' {
	class RoutePolicy {
		static declare(urlPrefix: string, type: string): void;

		static classify(url: string): string | null;
	}
}
