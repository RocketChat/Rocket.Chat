// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertInstanceOf, assertObjectMatch } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';

import { parseArgs } from '../listener/handler.ts';
import { AppAccessors } from '../../lib/accessors/mod.ts';
import { Room } from '../../lib/room.ts';
import { MessageExtender } from '../../lib/accessors/extenders/MessageExtender.ts';
import { RoomExtender } from '../../lib/accessors/extenders/RoomExtender.ts';
import { MessageBuilder } from '../../lib/accessors/builders/MessageBuilder.ts';
import { RoomBuilder } from '../../lib/accessors/builders/RoomBuilder.ts';

describe('handlers > listeners', () => {
    const mockAppAccessors = {
        getReader: () => ({ __type: 'reader' }),
        getHttp: () => ({ __type: 'http' }),
        getModifier: () => ({ __type: 'modifier' }),
        getPersistence: () => ({ __type: 'persistence' }),
        getSenderFn: () => (id: string) => Promise.resolve([{ __type: 'bridgeCall' }, { id }]),
    } as unknown as AppAccessors;

    it('correctly parses the arguments for a request to trigger the "checkPreMessageSentPrevent" method', () => {
        const evtMethod = 'checkPreMessageSentPrevent';
        // For the 'checkPreMessageSentPrevent' method, the context will be a message in a real scenario
        const evtArgs = [{ __type: 'context' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 3);
        assertEquals(params[0], { __type: 'context' });
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
    });

    it('correctly parses the arguments for a request to trigger the "checkPostMessageDeleted" method', () => {
        const evtMethod = 'checkPostMessageDeleted';
        // For the 'checkPostMessageDeleted' method, the context will be a message in a real scenario,
        // and the extraContext will provide further information such the user who deleted the message
        const evtArgs = [{ __type: 'context' }, { __type: 'extraContext' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 4);
        assertEquals(params[0], { __type: 'context' });
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
        assertEquals(params[3], { __type: 'extraContext' });
    });

    it('correctly parses the arguments for a request to trigger the "checkPreRoomCreateExtend" method', () => {
        const evtMethod = 'checkPreRoomCreateExtend';
        // For the 'checkPreRoomCreateExtend' method, the context will be a room in a real scenario
        const evtArgs = [
            {
                id: 'fake',
                type: 'fake',
                slugifiedName: 'fake',
                creator: 'fake',
                createdAt: Date.now(),
            },
        ];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 3);

        assertInstanceOf(params[0], Room);
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
    });

    it('correctly parses the arguments for a request to trigger the "executePreMessageSentExtend" method', () => {
        const evtMethod = 'executePreMessageSentExtend';
        // For the 'executePreMessageSentExtend' method, the context will be a message in a real scenario
        const evtArgs = [{ __type: 'context' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        // Instantiating the MessageExtender might modify the original object, so we need to assert it matches instead of equals
        assertObjectMatch(params[0] as Record<string, unknown>, {
            __type: 'context',
        });
        assertInstanceOf(params[1], MessageExtender);
        assertEquals(params[2], { __type: 'reader' });
        assertEquals(params[3], { __type: 'http' });
        assertEquals(params[4], { __type: 'persistence' });
    });

    it('correctly parses the arguments for a request to trigger the "executePreRoomCreateExtend" method', () => {
        const evtMethod = 'executePreRoomCreateExtend';
        // For the 'executePreRoomCreateExtend' method, the context will be a room in a real scenario
        const evtArgs = [{ __type: 'context' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        // Instantiating the RoomExtender might modify the original object, so we need to assert it matches instead of equals
        assertObjectMatch(params[0] as Record<string, unknown>, {
            __type: 'context',
        });
        assertInstanceOf(params[1], RoomExtender);
        assertEquals(params[2], { __type: 'reader' });
        assertEquals(params[3], { __type: 'http' });
        assertEquals(params[4], { __type: 'persistence' });
    });

    it('correctly parses the arguments for a request to trigger the "executePreMessageSentModify" method', () => {
        const evtMethod = 'executePreMessageSentModify';
        // For the 'executePreMessageSentModify' method, the context will be a message in a real scenario
        const evtArgs = [{ __type: 'context' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        // Instantiating the MessageBuilder might modify the original object, so we need to assert it matches instead of equals
        assertObjectMatch(params[0] as Record<string, unknown>, {
            __type: 'context',
        });
        assertInstanceOf(params[1], MessageBuilder);
        assertEquals(params[2], { __type: 'reader' });
        assertEquals(params[3], { __type: 'http' });
        assertEquals(params[4], { __type: 'persistence' });
    });

    it('correctly parses the arguments for a request to trigger the "executePreRoomCreateModify" method', () => {
        const evtMethod = 'executePreRoomCreateModify';
        // For the 'executePreRoomCreateModify' method, the context will be a room in a real scenario
        const evtArgs = [{ __type: 'context' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        // Instantiating the RoomBuilder might modify the original object, so we need to assert it matches instead of equals
        assertObjectMatch(params[0] as Record<string, unknown>, {
            __type: 'context',
        });
        assertInstanceOf(params[1], RoomBuilder);
        assertEquals(params[2], { __type: 'reader' });
        assertEquals(params[3], { __type: 'http' });
        assertEquals(params[4], { __type: 'persistence' });
    });

    it('correctly parses the arguments for a request to trigger the "executePostRoomUserJoined" method', () => {
        const evtMethod = 'executePostRoomUserJoined';
        // For the 'executePostRoomUserJoined' method, the context will be a room in a real scenario
        const room = {
            id: 'fake',
            type: 'fake',
            slugifiedName: 'fake',
            creator: 'fake',
            createdAt: Date.now(),
        };

        const evtArgs = [{ __type: 'context', room }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        assertInstanceOf((params[0] as any).room, Room);
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
        assertEquals(params[3], { __type: 'persistence' });
        assertEquals(params[4], { __type: 'modifier' });
    });

    it('correctly parses the arguments for a request to trigger the "executePostRoomUserLeave" method', () => {
        const evtMethod = 'executePostRoomUserLeave';
        // For the 'executePostRoomUserLeave' method, the context will be a room in a real scenario
        const room = {
            id: 'fake',
            type: 'fake',
            slugifiedName: 'fake',
            creator: 'fake',
            createdAt: Date.now(),
        };

        const evtArgs = [{ __type: 'context', room }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        assertInstanceOf((params[0] as any).room, Room);
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
        assertEquals(params[3], { __type: 'persistence' });
        assertEquals(params[4], { __type: 'modifier' });
    });

    it('correctly parses the arguments for a request to trigger the "executePostMessageDeleted" method', () => {
        const evtMethod = 'executePostMessageDeleted';
        // For the 'executePostMessageDeleted' method, the context will be a message in a real scenario
        const evtArgs = [{ __type: 'context' }, { __type: 'extraContext' }];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 6);
        assertEquals(params[0], { __type: 'context' });
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
        assertEquals(params[3], { __type: 'persistence' });
        assertEquals(params[4], { __type: 'modifier' });
        assertEquals(params[5], { __type: 'extraContext' });
    });

    it('correctly parses the arguments for a request to trigger the "executePostMessageSent" method', () => {
        const evtMethod = 'executePostMessageSent';
        // For the 'executePostMessageDeleted' method, the context will be a message in a real scenario
        const evtArgs = [
            {
                id: 'fake',
                sender: 'fake',
                createdAt: Date.now(),
                room: {
                    id: 'fake-room',
                    type: 'fake',
                    slugifiedName: 'fake',
                    creator: 'fake',
                    createdAt: Date.now(),
                },
            },
        ];

        const params = parseArgs({ AppAccessorsInstance: mockAppAccessors }, evtMethod, evtArgs);

        assertEquals(params.length, 5);
        assertObjectMatch((params[0] as Record<string, unknown>), { id: 'fake' });
        assertInstanceOf((params[0] as any).room, Room);
        assertEquals(params[1], { __type: 'reader' });
        assertEquals(params[2], { __type: 'http' });
        assertEquals(params[3], { __type: 'persistence' });
        assertEquals(params[4], { __type: 'modifier' });
    });
});
