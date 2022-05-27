export interface ILogin {
	email: string;
	password: string;
}

export interface IRegister {
	email: string;
	password: string;
	passwordConfirm?: string;
	name: string;
	username?: string;
}
