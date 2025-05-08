import type { MiddlewareHandler } from 'hono';

import { getRestPayload } from '../../../../server/lib/logger/logPayloads';
import { generateConnection } from '../api';
import { DDPCommon } from 'meteor/ddp-common';
import { DDP } from 'meteor/ddp';

export const meteorConnectionMiddleware: MiddlewareHandler = async (c, next) => {
    const requestIp = c.get('remoteAddress');
    const headers = c.req.raw.headers;
    const authToken = headers.get('x-auth-token');
    const token = (authToken && Accounts._hashLoginToken(String(authToken)))!;
    const objectHeaders = Object.fromEntries(headers.entries());
    const connection = { ...generateConnection(requestIp, objectHeaders), token };
    const userId = String(headers.get('x-user-id'));

    const invocation = new DDPCommon.MethodInvocation({
        connection,
        isSimulation: false,
        userId,
    });
    // console.log({ invocation})

    Accounts._accountData[connection.id] = {
        connection,
    };

    Accounts._setAccountData(connection.id, 'loginToken', token);
    // userId &&
    //     (await api.processTwoFactor({
    //         userId,
    //         request: this.request,
    //         invocation: invocation as unknown as Record<string, any>,
    //         options: _options,
    //         connection: connection as unknown as IMethodConnection,
    //     }));
    await DDP._CurrentInvocation.withValue(invocation as any, async () => next());

    // console.log('Meteor connection middleware', c.res);

    // Accounts._accountData[connection.id] = {
    //     connection,
    // };

    // Accounts._setAccountData(connection.id, 'loginToken', this.token!);

    // this.userId &&
    //     (await api.processTwoFactor({
    //         userId: this.userId,
    //         request: this.request,
    //         invocation: invocation as unknown as Record<string, any>,
    //         options: _options,
    //         connection: connection as unknown as IMethodConnection,
    //     }));


    // const startTime = Date.now();

    // let payload = {};

    // try {
    //     payload = await c.req.raw.clone().json();
    //     // eslint-disable-next-line no-empty
    // } catch { }

    // const log = logger.logger.child({
    //     method: c.req.method,
    //     url: c.req.url,
    //     userId: c.req.header('x-user-id'),
    //     userAgent: c.req.header('user-agent'),
    //     length: c.req.header('content-length'),
    //     host: c.req.header('host'),
    //     referer: c.req.header('referer'),
    //     remoteIP: c.get('remoteAddress'),
    //     ...(['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method) && getRestPayload(payload)),
    // });

    // await next();

    // log.http({
    //     status: c.res.status,
    //     responseTime: Date.now() - startTime,
    // });
};

