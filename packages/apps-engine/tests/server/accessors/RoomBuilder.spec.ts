import { Expect, Test } from 'alsatian';

import type { IRoom } from '../../../src/definition/rooms';
import { RoomType } from '../../../src/definition/rooms';
import { RoomBuilder } from '../../../src/server/accessors';
import { TestData } from '../../test-data/utilities';

export class RoomBuilderAccessorTestFixture {
    @Test()
    public basicRoomBuilder() {
        Expect(() => new RoomBuilder()).not.toThrow();
        Expect(() => new RoomBuilder(TestData.getRoom())).not.toThrow();
    }

    @Test()
    public settingOnRoomBuilder() {
        const rbOnce = new RoomBuilder();

        // setData just replaces the passed in object, so let's treat it differently
        Expect(rbOnce.setData({ displayName: 'Testing Channel' } as IRoom)).toBe(rbOnce);
        Expect((rbOnce as any).room.displayName).toBe('Testing Channel');

        const room: IRoom = {} as IRoom;
        const rb = new RoomBuilder(room);
        Expect(rb.setDisplayName('Just a Test')).toBe(rb);
        Expect(room.displayName).toEqual('Just a Test');
        Expect(rb.getDisplayName()).toEqual('Just a Test');

        Expect(rb.setSlugifiedName('just_a_test')).toBe(rb);
        Expect(room.slugifiedName).toEqual('just_a_test');
        Expect(rb.getSlugifiedName()).toEqual('just_a_test');

        Expect(rb.setType(RoomType.CHANNEL)).toBe(rb);
        Expect(room.type).toEqual(RoomType.CHANNEL);
        Expect(rb.getType()).toEqual(RoomType.CHANNEL);

        Expect(rb.setCreator(TestData.getUser())).toBe(rb);
        Expect(room.creator).toEqual(TestData.getUser());
        Expect(rb.getCreator()).toEqual(TestData.getUser());

        Expect(rb.addUsername('testing.username')).toBe(rb);
        Expect(room.usernames).not.toBeDefined();
        Expect(rb.getUsernames()).not.toBeEmpty();
        Expect(room.usernames).not.toBeDefined();
        Expect(rb.getUsernames()[0]).toEqual('testing.username');
        Expect(rb.addUsername('another.username')).toBe(rb);
        Expect(room.usernames).not.toBeDefined();
        Expect(rb.getUsernames().length).toBe(2);

        Expect(rb.setUsernames([])).toBe(rb);
        Expect(room.usernames).not.toBeDefined();
        Expect(rb.getUsernames()).toBeEmpty();

        Expect(rb.addMemberToBeAddedByUsername('testing.username')).toBe(rb);
        Expect(rb.getMembersToBeAddedUsernames()).not.toBeEmpty();
        Expect(rb.getMembersToBeAddedUsernames()[0]).toEqual('testing.username');
        Expect(rb.addMemberToBeAddedByUsername('another.username')).toBe(rb);
        Expect(rb.getMembersToBeAddedUsernames().length).toBe(2);

        Expect(rb.setMembersToBeAddedByUsernames([])).toBe(rb);
        Expect(rb.getMembersToBeAddedUsernames()).toBeEmpty();

        Expect(rb.setDefault(true)).toBe(rb);
        Expect(room.isDefault).toBeTruthy();
        Expect(rb.getIsDefault()).toBeTruthy();

        Expect(rb.setReadOnly(false)).toBe(rb);
        Expect(room.isReadOnly).not.toBeTruthy();
        Expect(rb.getIsReadOnly()).not.toBeTruthy();

        Expect(rb.setDisplayingOfSystemMessages(true)).toBe(rb);
        Expect(room.displaySystemMessages).toBeTruthy();
        Expect(rb.getDisplayingOfSystemMessages()).toBeTruthy();

        Expect(rb.addCustomField('thing', {})).toBe(rb);
        Expect(room.customFields).not.toBeEmpty();
        Expect(rb.getCustomFields()).not.toBeEmpty();
        Expect(room.customFields.thing).toBeDefined();
        Expect(rb.getCustomFields().thing).toBeEmpty();
        Expect(rb.addCustomField('another', { thingy: 'two' })).toBe(rb);
        Expect(room.customFields.another).toEqual({ thingy: 'two' });
        Expect(rb.getCustomFields().another).toEqual({ thingy: 'two' });

        Expect(rb.setCustomFields({})).toBe(rb);
        Expect(room.customFields).toBeEmpty();
        Expect(rb.getCustomFields()).toBeEmpty();

        Expect(rb.getRoom()).toBe(room);
    }
}
