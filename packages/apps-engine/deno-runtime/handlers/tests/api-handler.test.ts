// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertObjectMatch } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { spy } from "https://deno.land/std@0.203.0/testing/mock.ts";

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { assertInstanceOf } from "https://deno.land/std@0.203.0/assert/assert_instance_of.ts";
import { JsonRpcError } from "jsonrpc-lite";
import type { IApiEndpoint } from "@rocket.chat/apps-engine/definition/api/IApiEndpoint.ts";
import apiHandler from "../api-handler.ts";

describe('handlers > api', () => {
    const mockEndpoint: IApiEndpoint = {
        path: '/test',
        // deno-lint-ignore no-unused-vars
        get: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => Promise.resolve('ok'),
        // deno-lint-ignore no-unused-vars
        post: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => Promise.resolve('ok'),
        // deno-lint-ignore no-unused-vars
        put: (request: any, endpoint: any, read: any, modify: any, http: any, persis: any) => { throw new Error('Method execution error example') },
    }

    beforeEach(() => {
        AppObjectRegistry.clear();
        AppObjectRegistry.set('api:/test', mockEndpoint);
    });

    it('correctly handles execution of an api endpoint method GET', async () => {
        const _spy = spy(mockEndpoint, 'get');
        
        const result = await apiHandler('api:/test:get', ['request', 'endpointInfo']);

        assertEquals(result, 'ok');
        assertEquals(_spy.calls[0].args.length, 6);
        assertEquals(_spy.calls[0].args[0], 'request');
        assertEquals(_spy.calls[0].args[1], 'endpointInfo');
    });

    it('correctly handles execution of an api endpoint method POST', async () => {
        const _spy = spy(mockEndpoint, 'post');
        
        const result = await apiHandler('api:/test:post', ['request', 'endpointInfo']);

        assertEquals(result, 'ok');
        assertEquals(_spy.calls[0].args.length, 6);
        assertEquals(_spy.calls[0].args[0], 'request');
        assertEquals(_spy.calls[0].args[1], 'endpointInfo');
    });

    it('correctly handles an error if the method not exists for the selected endpoint', async () => {
        const result = await apiHandler(`api:/test:delete`, ['request', 'endpointInfo']);

        assertInstanceOf(result, JsonRpcError)
        assertObjectMatch(result, {
            message: `/test's delete not exists`,
            code: -32000
        })
    });

    it('correctly handles an error if endpoint not exists', async () => {
        const result = await apiHandler(`api:/error:get`, ['request', 'endpointInfo']);

        assertInstanceOf(result, JsonRpcError)
        assertObjectMatch(result, {
            message: `Endpoint /error not found`,
            code: -32000
        })
    });

    it('correctly handles an error if the method execution fails', async () => {
        const result = await apiHandler(`api:/test:put`, ['request', 'endpointInfo']);

        assertInstanceOf(result, JsonRpcError)
        assertObjectMatch(result, {
            message: `Method execution error example`,
            code: -32000
        })
    });
});
