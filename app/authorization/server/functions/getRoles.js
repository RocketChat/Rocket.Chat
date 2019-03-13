import { Roles } from '/app/models';

export const getRoles = () => Roles.find().fetch();
