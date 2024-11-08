import dotenv from 'dotenv';
import Joi from 'joi';
import fs from 'fs';

import { DynamicConfigurationParams, Module, Provider } from "../../application";
import { FUEL_DI_TOKENS, injectable, INJECTION_SCOPE, inject } from '../../dependency-injection';

type ConfigParams = {
    envFilePath: string;
    validationSchema: Joi.ObjectSchema;
    allowUnknown: boolean
};

export const parseEnvFile = ({ allowUnknown, validationSchema, envFilePath }: ConfigParams): Record<string, any> => {
    if (!fs.existsSync(envFilePath)) {
        throw new Error('.env file could not be loaded, please verify the provided path.');
    }
    const parsed = dotenv.parse(fs.readFileSync(envFilePath));
    const { error, value } = validationSchema.validate(parsed, { abortEarly: false, allowUnknown });
    if (error) {
        throw new Error(`.env file in an invalid format. Errors: ${error}`);
    }

    return value;
}

@injectable()
export class ConfigService {
    private environmentVariables: Record<string, any>;

    constructor(@inject(FUEL_DI_TOKENS.CONFIG_OPTIONS) { allowUnknown, validationSchema, envFilePath }: ConfigParams) {
        if (allowUnknown === undefined || validationSchema === undefined || envFilePath === undefined) {
            throw new Error('You must properly configure the ConfigModule');
        }
        const parsed = parseEnvFile({ allowUnknown, validationSchema, envFilePath });
        if (!parsed) {
            throw new Error('Cannot load the .env file');
        }
        this.environmentVariables = parsed;
    }

    public get(key: string): string | undefined {
        return this.environmentVariables.get(key);
    }
}

@injectable()
export class ConfigModule extends Module {
    private static providersInstance: Provider[] = [{ token: FUEL_DI_TOKENS.CONFIG_SERVICE, constructor: ConfigService, scope: INJECTION_SCOPE.SINGLETON }];

    public async onStopModule(): Promise<void> {

    }

    public async onStartModule(): Promise<void> {
    }

    public static configure(providers: DynamicConfigurationParams): void {
        if (!providers.some((provider) => provider.token === FUEL_DI_TOKENS.CONFIG_OPTIONS)) {
            throw new Error('You must provide the CONFIG_OPTIONS for the ConfigModule');
        }
        this.providersInstance.unshift(...providers);
    }

    public static providers(): Provider[] {
        if (!this.providersInstance.some((provider) => provider.token === FUEL_DI_TOKENS.CONFIG_OPTIONS)) {
            throw new Error('You must provide the CONFIG_OPTIONS for the ConfigModule');
        }
        return this.providersInstance;
    }
}
