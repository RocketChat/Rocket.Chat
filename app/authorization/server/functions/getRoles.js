import { Roles } from '../../../models';

export const getRoles = () => Roles.find().fetch();
