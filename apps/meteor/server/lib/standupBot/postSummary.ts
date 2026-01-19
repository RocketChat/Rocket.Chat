import { Messages, Rooms, Users } from '@rocket.chat/models';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { settings } from '../../../app/settings/server';

export async function postStandupSummary(): Promise<void> {
    try {
        const channelName = settings.get<string>('Standup_Bot_Channel') || 'daily-standup';
        const usersString = settings.get<string>('Standup_Bot_Users') || '';

        if (!usersString.trim()) {
            console.log('[Standup Bot] No users configured for summary');
            return;
        }

        const botUser = await Users.findOneByUsername('standup.bot');
        if (!botUser) {
            console.log('[Standup Bot] Bot user not found');
            return;
        }

        const targetChannel = await Rooms.findOneByName(channelName);
        if (!targetChannel) {
            console.log(`[Standup Bot] Channel not found: ${channelName}`);
            return;
        }

        // Collect responses from last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const usernames = usersString.split(',').map(u => u.trim()).filter(Boolean);
        let summary = `## 📊 Daily Standup Summary - ${new Date().toLocaleDateString()}\n\n`;

        for (const username of usernames) {
            const user = await Users.findOneByUsername(username);
            if (!user) continue;

            // Find DM room between bot and user
            const dmRoom = await Rooms.findOne({
                t: 'd',
                uids: { $all: [botUser._id, user._id], $size: 2 }
            });

            if (!dmRoom) {
                summary += `### 👤 ${username}\n_No response_\n\n`;
                continue;
            }

            // Get user's latest message in DM (their standup response)
            // Get user's latest message in DM (their standup response)
            const response = await Messages.findOne({
                rid: dmRoom._id,
                'u._id': user._id,  // ← CORRECT
                ts: { $gte: yesterday }
            }, {
                sort: { ts: -1 }
            });


            if (response && response.msg) {
                summary += `### 👤 ${username}\n${response.msg}\n\n`;
            } else {
                summary += `### 👤 ${username}\n_No response_\n\n`;
            }
        }

        // Post summary to channel
        await sendMessage(botUser, {
            msg: summary,
            rid: targetChannel._id,
        }, targetChannel);

        console.log(`[Standup Bot] Summary posted to ${channelName}`);
    } catch (error) {
        console.error('[Standup Bot] Error posting summary:', error);
    }
}
