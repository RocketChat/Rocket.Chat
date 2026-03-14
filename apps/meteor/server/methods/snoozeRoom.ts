import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../app/lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface ServerMethods {
        snoozeRoom(rid: string, durationMinutes: number): Promise<number>;
    }
}

export const snoozeRoomMethod = async (userId: string, rid: string, durationMinutes: number): Promise<number> => {
    check(rid, String);
    check(durationMinutes, Match.Where((n: number) => Number.isFinite(n) && n > 0 && n <= 10_080));

    if (!userId) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
            method: 'snoozeRoom',
        });
    }

    const until = new Date(Date.now() + durationMinutes * 60000);

    const { modifiedCount } = await Subscriptions.snoozeByRoomIdAndUserId(rid, userId, until);

    if (!modifiedCount) {
        throw new Meteor.Error('error-subscription-not-found', 'Subscription not found', { method: 'snoozeRoom' });
    }

    void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId);

    return modifiedCount;
};

Meteor.methods<ServerMethods>({
    async snoozeRoom(rid, durationMinutes) {
        const uid = Meteor.userId();

        if (!uid) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', {
                method: 'snoozeRoom',
            });
        }

        return snoozeRoomMethod(uid, rid, durationMinutes);
    },
});
