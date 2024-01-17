---
to: ee/apps/<%= name %>/src/<%= h.changeCase.pascalCase(name) %>.ts
---
import { ServiceClass } from '@rocket.chat/core-services';

export class <%= h.changeCase.pascalCase(name) %> extends ServiceClass {
	protected name = '<%= name %>';

	constructor() {
		super();

		// your stuff
	}

	// more stuff
}
