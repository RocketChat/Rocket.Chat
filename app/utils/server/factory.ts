import { IUserCommonUtils, UserCommonUtils } from '../lib/IUserCommonUtils';
import { Users } from '../../models/server';
import { settings } from '../../settings/server';

export const userCommonUtils: IUserCommonUtils = new UserCommonUtils(Users, settings);