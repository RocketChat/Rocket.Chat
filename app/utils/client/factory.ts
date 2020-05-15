import { IUserCommonUtils, UserCommonUtils } from '../lib/IUserCommonUtils';
import { Users } from '../../models/client';
import { settings } from '../../settings/client';

export const userCommonUtils: IUserCommonUtils = new UserCommonUtils(Users, settings);