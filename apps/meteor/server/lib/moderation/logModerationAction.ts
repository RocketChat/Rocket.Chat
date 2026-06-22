// apps/meteor/server/lib/moderation/logModerationAction.ts
import { ModerationAuditLogs, Users } from '@rocket.chat/models';

export async function logModerationAction({
	moderatorId,
	targetUserId,
	action,
	reason,
}: {
	moderatorId: string;
	targetUserId: string;
	action: 'mute' | 'deactivate' | 'flag' | 'dismiss';
	reason?: string;
}): Promise<void> {
	const [moderator, targetUser] = await Promise.all([
		Users.findOneById(moderatorId, { projection: { username: 1, name: 1 } }),
		Users.findOneById(targetUserId, { projection: { username: 1, name: 1, createdAt: 1 } }),
	]);

	if (!moderator || !targetUser) {
		return;
	}

	const ts = new Date();
	const targetCreatedAt = targetUser.createdAt ? new Date(targetUser.createdAt) : new Date();
	const targetAccountAge = isNaN(targetCreatedAt.getTime()) ? 0 : Math.floor((ts.getTime() - targetCreatedAt.getTime()) / 1000); // in seconds

	await ModerationAuditLogs.insertOne({
		ts,
		moderator: {
			_id: moderator._id,
			username: moderator.username || '',
			name: moderator.name || '',
		},
		action,
		targetUser: {
			_id: targetUser._id,
			username: targetUser.username || '',
			name: targetUser.name || '',
			createdAt: isNaN(targetCreatedAt.getTime()) ? new Date() : targetCreatedAt,
		},
		targetAccountAge,
		reason,
	});
}
