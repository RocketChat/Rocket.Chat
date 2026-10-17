import { AppMethod } from '../../src/definition/metadata';
import type { IPostUserCreated, IPostUserDeleted } from '../../src/definition/users';

export class DeletedUserHandler implements IPostUserDeleted {
	public async [AppMethod.EXECUTE_POST_USER_DELETED](): Promise<void> {}
}

export class CreatedUserHandler implements IPostUserCreated {
	public async [AppMethod.EXECUTE_POST_USER_CREATED](): Promise<void> {}
}

export const creationOnlyHandler: IPostUserDeleted = {
	// @ts-expect-error A creation handler does not implement the deletion event.
	[AppMethod.EXECUTE_POST_USER_CREATED]: async () => {},
};
