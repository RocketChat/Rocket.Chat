import { Users, Rooms, Subscriptions } from '@rocket.chat/models';
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
        const botUser = await Users.findOneByUsername('standup.bot');
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
                    
                    // Use existing utility function
                    const { createDirectRoom } = await import('../../../app/lib/server/functions/createDirectRoom');
                    

                    dmRoom = await createDirectRoom([botUser, user], {}, {});
                    
                    console.log(`[Standup Bot] Created DM room: ${dmRoom._id}`);
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
