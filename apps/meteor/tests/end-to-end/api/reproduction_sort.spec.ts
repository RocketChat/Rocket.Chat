
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import { api, getCredentials, request, credentials } from '../../data/api-data';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { updateSetting } from '../../data/permissions.helper';

describe('Members List Sorting', () => {
    let user1: any;
    let user2: any;
    let channel: any;

    before(async () => {
        await updateSetting('UI_Use_Real_Name', true);
        
        // Create users with names that would sort differently than their roles/status might imply if forced
        // User1: "Zebra" (We will make them Owner)
        // User2: "Apple" (We will keep them as Member)
        user1 = await createUser({ username: 'zebra', name: 'Zebra' });
        user2 = await createUser({ username: 'apple', name: 'Apple' });

        await login(user1.username, 'password');
        await login(user2.username, 'password');

        const roomResponse = await createRoom({
            type: 'c',
            name: `sorting-test-${Date.now()}`,
            credentials: credentials
        });
        channel = roomResponse.body.channel;

        // Add both users to the channel
        await request
            .post(api('channels.invite'))
            .set(credentials)
            .send({
                roomId: channel._id,
                userId: user1._id,
            })
            .expect(200);

        await request
            .post(api('channels.invite'))
            .set(credentials)
            .send({
                roomId: channel._id,
                userId: user2._id,
            })
            .expect(200);

        // Make user1 Owner
        await request
            .post(api('channels.addOwner'))
            .set(credentials)
            .send({
                roomId: channel._id,
                userId: user1._id,
            })
            .expect(200);
    });

    after(async () => {
        if (channel) {
            await deleteRoom({ type: 'c', roomId: channel._id });
        }
        await deleteUser(user1);
        await deleteUser(user2);
    });

    it('should respect requested sort order over default role sort', async () => {
        const response = await request
            .get(api('channels.members'))
            .set(credentials)
            .query({
                roomId: channel._id,
                sort: JSON.stringify({ name: 1 }), // Sort by name ascending
            })
            .expect(200);

        expect(response.body.success).to.be.true;
        const members = response.body.members;
        
        const user1Index = members.findIndex((m: any) => m._id === user1._id);
        const user2Index = members.findIndex((m: any) => m._id === user2._id);

        // Apple (User2) should come before Zebra (User1)
        // If Role sort is forced, User1 (Owner) will come before User2 (Member)
        expect(user2Index).to.be.lessThan(user1Index); 
    });
});
