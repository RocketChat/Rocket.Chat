import { Expect, Test } from 'alsatian';

import type { IHttpPreRequestHandler, IHttpPreResponseHandler } from '../../../src/definition/accessors';
import { HttpExtend } from '../../../src/server/accessors';

export class HttpExtendAccessorTestFixture {
    @Test()
    public basicHttpExtend() {
        Expect(() => new HttpExtend()).not.toThrow();

        const he = new HttpExtend();
        Expect(he.getDefaultHeaders()).toEqual(new Map());
        Expect(he.getDefaultParams()).toEqual(new Map());
        Expect(he.getPreRequestHandlers()).toBeEmpty();
        Expect(he.getPreResponseHandlers()).toBeEmpty();
    }

    @Test()
    public defaultHeadersInHttpExtend() {
        const he = new HttpExtend();

        Expect(() => he.provideDefaultHeader('Auth', 'token')).not.toThrow();
        Expect(he.getDefaultHeaders().size).toBe(1);
        Expect(he.getDefaultHeaders().get('Auth')).toBe('token');

        Expect(() =>
            he.provideDefaultHeaders({
                Auth: 'token2',
                Another: 'thing',
            }),
        ).not.toThrow();
        Expect(he.getDefaultHeaders().size).toBe(2);
        Expect(he.getDefaultHeaders().get('Auth')).toBe('token2');
        Expect(he.getDefaultHeaders().get('Another')).toBe('thing');
    }

    @Test()
    public defaultParamsInHttpExtend() {
        const he = new HttpExtend();

        Expect(() => he.provideDefaultParam('id', 'abcdefg')).not.toThrow();
        Expect(he.getDefaultParams().size).toBe(1);
        Expect(he.getDefaultParams().get('id')).toBe('abcdefg');

        Expect(() =>
            he.provideDefaultParams({
                id: 'zyxwvu',
                count: '4',
            }),
        ).not.toThrow();
        Expect(he.getDefaultParams().size).toBe(2);
        Expect(he.getDefaultParams().get('id')).toBe('zyxwvu');
        Expect(he.getDefaultParams().get('count')).toBe('4');
    }

    @Test()
    public preRequestHandlersInHttpExtend() {
        const he = new HttpExtend();

        const preRequestHandler: IHttpPreRequestHandler = {
            executePreHttpRequest: function _thing(url, req) {
                return new Promise((resolve) => resolve(req));
            },
        };

        Expect(() => he.providePreRequestHandler(preRequestHandler)).not.toThrow();
        Expect(he.getPreRequestHandlers()).not.toBeEmpty();
    }

    @Test()
    public preResponseHandlersInHttpExtend() {
        const he = new HttpExtend();

        const preResponseHandler: IHttpPreResponseHandler = {
            executePreHttpResponse: function _thing(res) {
                return new Promise((resolve) => resolve(res));
            },
        };

        Expect(() => he.providePreResponseHandler(preResponseHandler)).not.toThrow();
        Expect(he.getPreResponseHandlers()).not.toBeEmpty();
    }
}
