---
to: ee/apps/<%= name %>/src/<%= h.changeCase.pascalCase(name) %>.ts
---
import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { I<%= h.changeCase.pascalCase(name) %>Service } from '../../../../apps/meteor/server/sdk/types/I<%= h.changeCase.pascalCase(name) %>Service';

export class <%= h.changeCase.pascalCase(name) %> extends ServiceClass implements I<%= h.changeCase.pascalCase(name) %>Service {
	protected name = '<%= name %>';

	constructor() {
		super();

		// your stuff
	}

	// more stuff
}
