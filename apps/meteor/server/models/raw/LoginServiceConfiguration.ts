import type { ILoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class LoginServiceConfigurationRaw extends BaseRaw<ILoginServiceConfiguration> implements ILoginServiceConfigurationModel {}
