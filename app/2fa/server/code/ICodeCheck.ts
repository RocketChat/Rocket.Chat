import { IUser } from '../../../../definition/IUser';

export interface IProcessInvalidCodeResult {
	codeGenerated: boolean;
	codeCount?: number;
	codeExpires?: Date[];
}

export interface ICodeCheck {
	readonly name: string;

	isEnabled(user: IUser, force?: boolean): boolean;

	verify(user: IUser, code: string, force?: boolean): boolean;

	processInvalidCode(user: IUser): IProcessInvalidCodeResult;
}
