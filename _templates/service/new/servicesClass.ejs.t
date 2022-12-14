---
to: ee/apps/<%= name %>/src/<%= h.changeCase.pascalCase(name) %>.ts
---
import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';

export class <%= h.changeCase.pascalCase(name) %> extends ServiceClass {
	protected name = '<%= name %>';

	constructor() {
		super();

		// your stuff
	}

	// more stuff
}
