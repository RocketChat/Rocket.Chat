import { v4 } from 'uuid';

import { ILogin, IRegister } from '../interfaces/Login';

export const reason = 'rocket.chat.reason';

export const adminRegister: IRegister = {
	name: 'rocketchat.internal.admin.test',
	email: 'rocketchat.internal.admin.test@rocket.chat',
	password: 'rocketchat.internal.admin.test',
};

export const adminLogin: ILogin = {
	email: 'rocketchat.internal.admin.test@rocket.chat',
	password: 'rocketchat.internal.admin.test',
};

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

export const VALID_EMAIL = 'email@email.com';
export const INVALID_EMAIL = 'mail@mail';
export const INVALID_EMAIL_WITHOUT_MAIL_PROVIDER = 'email';
export const ROCKET_CAT = 'rocket.cat';
export const WRONG_PASSWORD = 'passwo1';
