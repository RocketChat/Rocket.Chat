declare module 'meteor/webapp' {
	import type * as express from 'express';

	namespace WebApp {
		// Present in Meteor 3's generated types but missing from @types/meteor.
		const rawHandlers: express.Application;
	}
}
