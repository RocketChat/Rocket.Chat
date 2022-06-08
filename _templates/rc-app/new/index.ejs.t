---
to: apps/<%= name %>/src/<%= h.capitalize(name) %>App.ts
---
import type {
	IAppAccessors,
	ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

export class <%= h.capitalize(name) %>App extends App {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}
}
