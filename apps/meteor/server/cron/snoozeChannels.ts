import { cronJobs } from '@rocket.chat/cron';
import { Subscriptions } from '@rocket.chat/models';

import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';

export const snoozeChannelsCron = async (): Promise<void> => {
    const name = 'Unsnooze Channels';
    return cronJobs.add(name, '* * * * *', async () => {
        const currentDate = new Date();
        const expiredSubscriptions = await Subscriptions.find(
            { snoozedUntil: { $lte: currentDate } },
            { projection: { _id: 1 } },
        ).toArray();

        if (expiredSubscriptions.length > 0) {
            await Subscriptions.unsnoozeRooms(currentDate);

            for (const sub of expiredSubscriptions) {
                void notifyOnSubscriptionChangedById(sub._id);
            }
        }
    });
};
