declare module 'meteor/babel-compiler' {
	namespace Babel {
		function getDefaultOptions(options: Record<string, any>): Record<string, any>;
		function compile(script: string, options: Record<string, any>): { code: string };
	}
}
