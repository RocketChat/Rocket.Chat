import type { IPostUserCreated, IPostUserDeleted } from '../../src/definition/users';
import { AppMethod } from '../../src/definition/metadata';

type Assert<T extends true> = T;
type AssignableTo<A, B> = [A] extends [B] ? true : false;
type Not<T extends boolean> = T extends true ? false : true;

type UserCreatedHandler = {
	[AppMethod.EXECUTE_POST_USER_CREATED]: () => Promise<void>;
};

type UserDeletedHandler = {
	[AppMethod.EXECUTE_POST_USER_DELETED]: () => Promise<void>;
};

export class ValidUserCreatedHandler implements IPostUserCreated {
	public async [AppMethod.EXECUTE_POST_USER_CREATED](): Promise<void> {}
}

export class ValidUserDeletedHandler implements IPostUserDeleted {
	public async [AppMethod.EXECUTE_POST_USER_DELETED](): Promise<void> {}
}

export type UserCreatedHandlerIsNotADeletionHandler = Assert<
	Not<AssignableTo<UserCreatedHandler, IPostUserDeleted>>
>;
export type UserDeletedHandlerIsNotACreationHandler = Assert<
	Not<AssignableTo<UserDeletedHandler, IPostUserCreated>>
>;
