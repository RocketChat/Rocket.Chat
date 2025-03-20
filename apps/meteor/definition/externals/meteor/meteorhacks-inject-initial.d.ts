declare module 'meteor/meteorhacks:inject-initial' {
	namespace Inject {
		function rawBody(key: string, value: string): void;
		function rawModHtml(key: string, value: (html: string) => string): void;
	}
}
