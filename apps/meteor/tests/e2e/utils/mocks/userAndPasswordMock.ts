import { faker } from '@faker-js/faker';

import { ILogin, IRegister } from '../interfaces/Login';

export const adminLogin: ILogin = {
	email: 'rocketchat.internal.admin.test@rocket.chat',
	password: 'rocketchat.internal.admin.test',
};

export const validUserInserted: ILogin = {
	email: 'user.name.test@email.com',
	password: 'any_password',
};

export const registerUser: IRegister = {
	email: faker.internet.email(),
	password: 'any_password',
	name: faker.name.findName(),
};

export const createRegisterUser = (): IRegister => {
	const name = faker.name.findName();
	const [firstName] = name.split(' ');
	return {
		email: faker.internet.email(firstName.toLocaleLowerCase()),
		password: 'any_password',
		name,
		username: faker.internet.userName(),
	};
};
