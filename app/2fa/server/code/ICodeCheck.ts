import { IUser } from '../../../../definition/IUser';

export interface ICodeCheck {
	isEnabled(user: IUser): boolean;

	verify(user: IUser, code: string): boolean;

	processInvalidCode(user: IUser, code: string): void;
}
