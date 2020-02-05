import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { callbacks } from '../../../callbacks';
import { ChatRoom } from '../../../models';

callbacks.add('enter-room', (/* sub */) => {
    const rid = Session.get('openedRoom')
    if (!rid) {
        return;
    }

    const room = ChatRoom.findOne({ _id: rid });
    if (!room || !room.t || room.t !== 'l') {
        return;
    }

    console.log(room);
});
