import { v4 } from 'uuid';

import { ILogin, IRegister } from '../interfaces/Login';

export const username = 'user.test';
export const email = `${username}@rocket.chat`;
export const password = 'rocket.chat';

export const registerUser: IRegister = {
	email: `${v4()}@email.com`,
	password: 'any_password',
	name: `any_name${v4()}`,
};

export const validUser: ILogin = {
	email: 'rocketchat.internal.admin.test@rocket.chat',
	password: 'rocketchat.internal.admin.test',
};

export const incorrectUser: ILogin = {
	email: `${v4()}@email.com`,
	password: 'any_password',
};
