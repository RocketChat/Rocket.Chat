import { v4 } from 'uuid';

import { ILogin, IRegister } from '../interfaces/Login';

export const username = 'user.test';
export const email = `${username}@rocket.chat`;
export const password = 'rocket.chat';
export const reason = 'rocket.chat.reason';
export const adminUsername = 'rocketchat.internal.admin.test';
export const adminEmail = `${adminUsername}@rocket.chat`;
export const adminPassword = adminUsername;

export const registerUser: IRegister = {
	email: `any_user@email.com`,
	password: 'any_password',
	name: `any_name${v4()}`,
};

export const validUser: ILogin = {
	email: 'any_user@email.com',
	password: 'any_password',
};

export const incorrectUser: ILogin = {
	email: `${v4()}@email.com`,
	password: 'any_password',
};
