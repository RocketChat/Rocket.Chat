import PermissionsModel from '../models/Permissions';
import { PermissionsRaw } from './Permissions';
import RolesModel from '../models/Roles';
import { RolesRaw } from './Roles';
import SubscriptionsModel from '../models/Subscriptions';
import { SubscriptionsRaw } from './Subscriptions';
import SettingsModel from '../models/Settings';
import { SettingsRaw } from './Settings';
import UsersModel from '../models/Users';
import { UsersRaw } from './Users';

export const Permissions = new PermissionsRaw(PermissionsModel.model.rawCollection());
export const Roles = new RolesRaw(RolesModel.model.rawCollection());
export const Subscriptions = new SubscriptionsRaw(SubscriptionsModel.model.rawCollection());
export const Settings = new SettingsRaw(SettingsModel.model.rawCollection());
export const Users = new UsersRaw(UsersModel.model.rawCollection());
