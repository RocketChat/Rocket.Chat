// Node 24 takes a mocked module's exports as `exports`, which the `@types/node` in use does not know yet.
import 'node:test';

declare module 'node:test' {
	namespace test {
		interface MockModuleOptions {
			exports?: object | undefined;
		}
	}
}
