import { faker } from '@faker-js/faker';

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

export const validUserInserted: ILogin = {
	email: 'user.name.test@email.com',
	password: 'any_password',
};

const validEmail = faker.internet.email();

export const registerUser: IRegister = {
	email: validEmail,
	password: 'any_password',
	name: faker.name.findName(),
};

export const createRegisterUser = (): IRegister => ({
	email: validEmail,
	password: 'any_password',
	name: faker.name.findName(),
	username: faker.internet.userName(),
});

export const validUser: ILogin = {
	email: validEmail,
	password: 'any_password',
};

export const incorrectUser: ILogin = {
	email: faker.internet.email(),
	password: 'any_password',
};

export const VALID_EMAIL = 'email@email.com';
export const INVALID_EMAIL = 'mail@mail';
export const INVALID_EMAIL_WITHOUT_MAIL_PROVIDER = 'email';
export const ROCKET_CAT = 'rocket.cat';
export const WRONG_PASSWORD = 'passwo1';
