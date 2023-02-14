declare module 'meteor/routepolicy' {
	export class RoutePolicy {
		static declare(urlPrefix: string, type: string): void;
	}
}
