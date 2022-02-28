import { IRole } from '../../../../definition/IUser';
import { Roles } from '../../../models/server/raw';

export const getRoles = (): IRole[] => Promise.await(Roles.find().toArray());
