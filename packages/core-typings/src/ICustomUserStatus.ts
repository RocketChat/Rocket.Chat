import { IUserStatus } from './IUserStatus';

export interface ICustomUserStatus extends IUserStatus {
  _updatedAt?: Date;
}
