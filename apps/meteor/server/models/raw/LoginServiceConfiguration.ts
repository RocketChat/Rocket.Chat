import type { ILoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { ILoginServiceConfigurationModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class LoginServiceConfigurationRaw extends ModelClass<ILoginServiceConfiguration> implements ILoginServiceConfigurationModel {}
