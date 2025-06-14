import { cronJobs } from '@rocket.chat/cron';
import { Rooms, Messages } from '@rocket.chat/models';
import { sendMessage } from '/app/lib/server/functions/sendMessage';
import { ScheduledMessages } from '/app/models/server/models/ScheduledMessages';
import { Users } from '@rocket.chat/models';

export async function scheduleMessagesCron(): Promise<void> {
  const name = 'sendScheduledMessages';

  return cronJobs.add(name, '*/1 * * * *', async () => {
    console.log('Checking for scheduled messages...');
    const now = new Date();
    console.log('Current time:', now.toISOString());

    const scheduledMessages = await ScheduledMessages.find({
      t: 'scheduled_message',
      scheduledAt: { $lte: now },
    }).fetchAsync();

    console.log(`Found ${scheduledMessages.length} scheduled messages to process`);

    for (const message of scheduledMessages) {
      console.log(`Processing message ${message._id} scheduled for ${message.scheduledAt.toISOString()}`);
      try {
        const user = await Users.findOneById(message.u._id, {
          projection: { username: 1, type: 1, name: 1 },
        });
        if (!user) {
          console.error(`User ${message.u._id} not found for scheduled message ${message._id}`);
          continue;
        }

        const room = await Rooms.findOneById(message.rid);
        if (!room) {
          console.error(`Room ${message.rid} not found for scheduled message ${message._id}`);
          continue;
        }

        const messageToSend = {
          // _id: message._id, // Removed to avoid conflicts
          rid: message.rid,
          tmid: message.tmid,
          msg: message.msg,
          u: { _id: user._id, username: user.username },
          ts: message.scheduledAt,
          _updatedAt: new Date(),
        };

        console.log(`Sending message to room ${message.rid} with original scheduled _id ${message._id}`);
        const result = await sendMessage(user, messageToSend, room);
        console.log(`sendMessage result for scheduled message ${message._id}:`, result);

        const insertedMessage = await Messages.findOneById(result._id);
        if (!insertedMessage) {
          console.error(`Message ${result._id} was not inserted into messages collection`);
        } else {
          console.log(`Message ${result._id} successfully inserted into messages collection`);
        }

        await ScheduledMessages.removeAsync({ _id: message._id });
        console.log(`Sent scheduled message ${message._id} (new message _id: ${result._id}) at ${now.toISOString()}`);
      } catch (error) {
        console.error(`Failed to send scheduled message ${message._id}:`, error);
      }
    }
  });
}