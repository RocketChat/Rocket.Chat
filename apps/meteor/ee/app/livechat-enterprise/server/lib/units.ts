import { LivechatUnit } from '@rocket.chat/models';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';

async function hasUnits(): Promise<boolean> {
	// @ts-expect-error - this prop is injected dynamically on ee license
	return (await LivechatUnit.countUnits({ type: 'u' })) > 0;
}

// Units should't change really often, so we can cache the result
const memoizedHasUnits = mem(hasUnits, { maxAge: process.env.TEST_MODE ? 1 : 10000 });

export async function getUnitsFromUser(): Promise<string[] | undefined> {
	if (!(await memoizedHasUnits())) {
		return;
	}

	return Meteor.callAsync('livechat:getUnitsFromUser');
}
