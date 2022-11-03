import type { IUser } from '@rocket.chat/core-typings';

export interface IProcessInvalidCodeResult {
	codeGenerated: boolean;
	codeCount?: number;
	codeExpires?: Date[];
	emailOrUsername?: string;
}

export interface ICodeCheck {
	readonly name: string;

	isEnabled(user: IUser, force?: boolean): boolean;

	verify(user: IUser, code: string, force?: boolean): boolean;

	processInvalidCode(user: IUser): IProcessInvalidCodeResult;
}
