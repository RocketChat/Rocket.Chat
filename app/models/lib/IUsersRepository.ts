import { IUser } from "/definition/IUser";
import { IOptions } from "/app/models/lib/IOptions";

export interface IUsersRepository {
    findOneById(userId: string, options?: IOptions): IUser;
}