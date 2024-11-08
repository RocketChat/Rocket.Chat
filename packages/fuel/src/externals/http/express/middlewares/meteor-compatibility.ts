import type { NextFunction, Request, Response } from 'express';
import type { ExpressMiddlewareInterface } from 'routing-controllers';
import { Middleware } from 'routing-controllers';

import { injectable } from '../../../../internals';

// TODO: Remove this as soon as we move away from Meteor.
// This is a workaround to make Meteor's WebApp work with routing-controllers
// Since any thing we attach on to connectHandlers will be added AFTER Meteor's default handler
// We need this to prevent the default handler try to send headers after the request is already ended
// https://github.com/meteor/meteor/blob/devel/packages/webapp/webapp_server.js#L1175-L1176
// https://github.com/meteor/meteor/blob/devel/packages/webapp/webapp_server.js#L1193
@injectable()
@Middleware({ type: 'after' })
export class MeteorCompatibilityMiddleware implements ExpressMiddlewareInterface {
	use(_: Request, response: Response, next: NextFunction): void {
		if (!response.headersSent) {
			next();
		}
	}
}
