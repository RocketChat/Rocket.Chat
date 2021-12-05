import 'meteor/ejson';

declare module 'meteor/ejson' {
	namespace EJSON {
		function stringify(
			val: EJSONableProperty,
			options?: {
				indent?: boolean | number | string | undefined;
				canonical?: boolean | undefined;
			},
		): string;

		function parse(str: string): EJSONableProperty;
	}
}
