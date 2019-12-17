import { IUser } from '../../../../definition/IUser';

export interface IProcessInvalidCodeResult {
	codeGenerated: boolean;
	codeCount?: number;
	codeExpires?: Date[];
}

export interface ICodeCheck {
	isEnabled(user: IUser): boolean;

	verify(user: IUser, code: string): boolean;

	processInvalidCode(user: IUser): IProcessInvalidCodeResult;
}
