import { IUser } from '@rocket.chat/core-typings';

// A post request should not contain an id.
export type UserCreationParams = Pick<IUser, "username">;

export class UsersService {
  public get(id: number, name?: string): IUser {
    return {
      _id: 'lero',
      username: 'hello',
      name: name ?? "Jane Doe",
      createdAt: new Date(),
      active: true,
      type: 'user',
      roles: ['user'],
      _updatedAt: new Date(),
      // status: "online",
      // phoneNumbers: [],
    };
  }

  public getAll(name?: string): IUser[] {
	return [
		{
      _id: 'lero1',
      username: 'hello',
      name: name ?? "Jane Doe",
      createdAt: new Date(),
      active: true,
      type: 'user',
      roles: ['user'],
      _updatedAt: new Date(),
		},
		{
      _id: 'lero2',
      username: 'hello',
      name: name ?? "Jane Doe",
      createdAt: new Date(),
      active: true,
      type: 'user',
      roles: ['user'],
      _updatedAt: new Date(),
		}
	]
  }

  public create(userCreationParams: UserCreationParams): IUser {
    return {
      _id: 'lero',
      username: 'hello',
      name: "Jane Doe",
      createdAt: new Date(),
      active: true,
      type: 'user',
      roles: ['user'],
      _updatedAt: new Date(),
      ...userCreationParams,
    };
  }
}
