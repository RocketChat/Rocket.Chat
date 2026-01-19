import { Users, Rooms, Subscriptions } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { settings } from '../../../app/settings/server';

const STANDUP_QUESTIONS = `
📋 **Daily Standup Time!**

Please answer these questions:

1️⃣ What did you work on yesterday?
2️⃣ What are you working on today?
3️⃣ Any blockers or help needed?

Reply to this message with your update.
`;

export async function sendStandupPrompts(): Promise<void> {
    try {
        const usersString = settings.get<string>('Standup_Bot_Users') || '';
        if (!usersString.trim()) {
            console.log('[Standup Bot] No users configured');
            return;
        }

        // Parse comma-separated usernames
        const usernames = usersString.split(',').map(u => u.trim()).filter(Boolean);

        // Get bot user
        let botUser = await Users.findOneByUsername('standup.bot');
        if (!botUser) {
            console.log('[Standup Bot] Bot user not found, please create user: standup.bot');
            return;
        }

        console.log(`[Standup Bot] Bot user found: ${botUser._id}`);

        // Send DM to each user
        for (const username of usernames) {
            try {
                const user = await Users.findOneByUsername(username);
                if (!user) {
                    console.log(`[Standup Bot] User not found: ${username}`);
                    continue;
                }

                console.log(`[Standup Bot] Processing user: ${username} (${user._id})`);

                // Get or create DM room
                let dmRoom = await Rooms.findOne({
                    t: 'd',
                    uids: { $all: [botUser._id, user._id], $size: 2 }
                });

                if (!dmRoom) {
                    console.log('[Standup Bot] Creating new DM room...');
                    
                    // Create DM room manually
                    const roomId = Random.id();
                    const now = new Date();
                    
                    const newRoom = {
                        _id: roomId,
                        t: 'd',
                        usernames: [botUser.username, user.username],
                        uids: [botUser._id, user._id],
                        usersCount: 2,
                        msgs: 0,
                        ts: now,
                        _updatedAt: now,
                    };
                    
                    await Rooms.insertOne(newRoom as any);

                    // Create subscriptions for both users
                    await Subscriptions.insertOne({
                        _id: Random.id(),
                        rid: roomId,
                        u: { _id: botUser._id, username: botUser.username },
                        t: 'd',
                        ts: now,
                        name: user.username,
                        open: true,
                        alert: false,
                        unread: 0,
                        _updatedAt: now,
                    } as any);

                    await Subscriptions.insertOne({
                        _id: Random.id(),
                        rid: roomId,
                        u: { _id: user._id, username: user.username },
                        t: 'd',
                        ts: now,
                        name: botUser.username,
                        open: true,
                        alert: true,
                        unread: 0,
                        _updatedAt: now,
                    } as any);

                    // Use the room we just created
                    dmRoom = newRoom as any;
                    console.log(`[Standup Bot] Created DM room: ${roomId}`);
                }

                console.log(`[Standup Bot] Using DM room: ${dmRoom?._id || 'UNDEFINED'}`);

                // Safety check
                if (!dmRoom || !dmRoom._id) {
                    console.error('[Standup Bot] DM room is invalid!');
                    continue;
                }

                // Send the standup prompt
                await sendMessage(botUser, {
                    msg: STANDUP_QUESTIONS,
                    rid: dmRoom._id,
                }, dmRoom);

                console.log(`[Standup Bot] ✓ Sent prompt to: ${username}`);
            } catch (error) {
                console.error(`[Standup Bot] Error sending to ${username}:`, error);
            }
        }

        console.log(`[Standup Bot] Prompts sent to ${usernames.length} users`);
    } catch (error) {
        console.error('[Standup Bot] Error sending prompts:', error);
    }
}
