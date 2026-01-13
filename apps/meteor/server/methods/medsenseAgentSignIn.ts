import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RateLimiterClass as RateLimiter } from '../../app/lib/server/lib/RateLimiter';
import { settings } from '../../app/settings/server';

type MedsenseAgentSignInOptions = {
	role: 'pharmacist' | 'technician' | 'assistant';
	endTime: string;
};

const normalizeRoleSetting = (rolesSetting: unknown): string[] => {
	if (Array.isArray(rolesSetting)) {
		return rolesSetting.filter((role): role is string => typeof role === 'string' && role.trim().length > 0);
	}

	if (typeof rolesSetting === 'string') {
		return rolesSetting
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean);
	}

	return [];
};

export const medsenseAgentSignIn = async (userId: IUser['_id'] | null, options: MedsenseAgentSignInOptions): Promise<boolean> => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseAgentSignIn',
		});
	}

	check(userId, String);
	check(options, {
		role: Match.Where((value) => value === 'pharmacist' || value === 'technician' || value === 'assistant'),
		endTime: String,
	});

	const user = await Users.findOneById(userId, { projection: { roles: 1 } });
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseAgentSignIn',
		});
	}

	const userRoles = Array.isArray(user.roles) ? user.roles : [];
	const pharmacistRoles = normalizeRoleSetting(settings.get('Medsense_Sign_In_Role_Pharmacist_Roles'));
	const technicianRoles = normalizeRoleSetting(settings.get('Medsense_Sign_In_Role_Technician_Roles'));
	const assistantRoles = normalizeRoleSetting(settings.get('Medsense_Sign_In_Role_Assistant_Roles'));

	const roleMapping: Record<MedsenseAgentSignInOptions['role'], string[]> = {
		pharmacist: pharmacistRoles,
		technician: technicianRoles,
		assistant: assistantRoles,
	};

	const allowedRoles = roleMapping[options.role];
	if (!allowedRoles.length || !userRoles.some((role) => allowedRoles.includes(role))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'medsenseAgentSignIn',
		});
	}

	const endTime = new Date(options.endTime);
	if (Number.isNaN(endTime.getTime())) {
		throw new Meteor.Error('error-invalid-end-time', 'Invalid end time', {
			method: 'medsenseAgentSignIn',
		});
	}

	const startTime = new Date();
	if (endTime.getTime() <= startTime.getTime()) {
		throw new Meteor.Error('error-invalid-end-time', 'Invalid end time', {
			method: 'medsenseAgentSignIn',
		});
	}

	await Users.setCustomFields(userId, {
		medsenseSignInRole: options.role,
		medsenseSignInStart: startTime.toISOString(),
		medsenseSignInEnd: endTime.toISOString(),
	});

	return true;
};

export const medsenseAgentSignOut = async (userId: IUser['_id'] | null): Promise<boolean> => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseAgentSignOut',
		});
	}

	check(userId, String);

	const user = await Users.findOneById(userId, { projection: { _id: 1 } });
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'medsenseAgentSignOut',
		});
	}

	const now = new Date();
	await Users.setCustomFields(userId, {
		medsenseSignInEnd: now.toISOString(),
	});

	return true;
};

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		medsenseAgentSignIn(options: MedsenseAgentSignInOptions): boolean;
		medsenseAgentSignOut(): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async medsenseAgentSignIn(options: MedsenseAgentSignInOptions) {
		return medsenseAgentSignIn(Meteor.userId(), options);
	},
	async medsenseAgentSignOut() {
		return medsenseAgentSignOut(Meteor.userId());
	},
});

RateLimiter.limitMethod('medsenseAgentSignIn', 5, 60000, {});
RateLimiter.limitMethod('medsenseAgentSignOut', 5, 60000, {});
