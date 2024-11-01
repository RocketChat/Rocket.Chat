import { Expect, Test } from 'alsatian';

import type { IRoom } from '../../../src/definition/rooms';
import { RoomExtender } from '../../../src/server/accessors';
import { TestData } from '../../test-data/utilities';

export class RoomExtenderAccessorTestFixture {
    @Test()
    public basicRoomExtender() {
        Expect(() => new RoomExtender({} as IRoom)).not.toThrow();
        Expect(() => new RoomExtender(TestData.getRoom())).not.toThrow();
    }

    @Test()
    public usingRoomExtender() {
        const room: IRoom = {} as IRoom;
        const re = new RoomExtender(room);

        Expect(room.customFields).not.toBeDefined();
        Expect(re.addCustomField('thing', 'value')).toBe(re);
        Expect(room.customFields).toBeDefined();
        Expect(room.customFields.thing as any).toBe('value');
        Expect(() => re.addCustomField('thing', 'second')).toThrowError(Error, 'The room already contains a custom field by the key: thing');
        Expect(() => re.addCustomField('thing.', 'second')).toThrowError(Error, 'The given key contains a period, which is not allowed. Key: thing.');

        Expect(room.usernames).not.toBeDefined();
        Expect(re.addMember(TestData.getUser('theId', 'bradley'))).toBe(re);
        Expect(room.usernames).not.toBeDefined();
        Expect(re.getMembersBeingAdded()).toBeDefined();
        Expect(re.getMembersBeingAdded()).not.toBeEmpty();
        Expect(re.getMembersBeingAdded()[0]).not.toBeEmpty();
        Expect(re.getMembersBeingAdded()[0].username).toBe('bradley');
        Expect(() => re.addMember(TestData.getUser('theSameUsername', 'bradley'))).toThrowError(Error, 'The user is already in the room.');

        Expect(re.getRoom()).not.toBe(room);
        Expect(re.getRoom()).toEqual(room);
    }
}
