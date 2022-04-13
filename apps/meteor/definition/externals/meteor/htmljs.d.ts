declare module 'meteor/htmljs' {
	namespace HTML {
		function Comment(value: string): unknown;
		function Raw(value: string): unknown;
		function DIV(attributes?: Record<string, unknown>): unknown;
	}
}
