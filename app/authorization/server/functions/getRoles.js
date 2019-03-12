import { Roles } from 'meteor/rocketchat:models';

export const getRoles = () => Roles.find().fetch();
