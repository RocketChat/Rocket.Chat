import { ILivechatAgentStatus } from '@rocket.chat/core-typings';
import type { AtLeast, ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents, LivechatDepartment } from '@rocket.chat/models';

import { setUserStatusLivechat } from './utils';
import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChangedByDepartmentId } from '../../../lib/server/lib/notifyListener';

export async function afterAgentUserActivated(user: IUser) {
	if (!user.roles.includes('livechat-agent')) {
		throw new Error('invalid-user-role');
	}
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);
}

export async function afterAgentAdded(user: IUser) {
	await setUserStatusLivechat(user._id, user.status !== 'offline' ? ILivechatAgentStatus.AVAILABLE : ILivechatAgentStatus.NOT_AVAILABLE);
	callbacks.runAsync('livechat.onNewAgentCreated', user._id);

	return user;
}

export async function afterRemoveAgent(user: AtLeast<IUser, '_id' | 'username'>) {
	await callbacks.run('livechat.afterAgentRemoved', { agent: user });
	return true;
}

export async function afterDepartmentArchived(department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>) {
	await Promise.all([
		LivechatDepartmentAgents.disableAgentsByDepartmentId(department._id),
		LivechatDepartment.archiveDepartment(department._id),
	]);

	void notifyOnLivechatDepartmentAgentChangedByDepartmentId(department._id);

	await callbacks.run('livechat.afterDepartmentArchived', department);
}

export async function afterDepartmentUnarchived(department: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>) {
	await Promise.all([
		LivechatDepartmentAgents.enableAgentsByDepartmentId(department._id),
		LivechatDepartment.unarchiveDepartment(department._id),
	]);

	void notifyOnLivechatDepartmentAgentChangedByDepartmentId(department._id);
}
