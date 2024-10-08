import type { IEnvironmentalVariableRead } from './IEnvironmentalVariableRead';
import type { IServerSettingRead } from './IServerSettingRead';
import type { ISettingRead } from './ISettingRead';

/**
 * Allows read-access to the App's settings,
 * the certain server's settings along with environmental
 * variables all of which are not user created.
 */
export interface IEnvironmentRead {
    /** Gets an instance of the App's settings reader. */
    getSettings(): ISettingRead;

    /**
     * Gets an instance of the Server's Settings reader.
     * Please note: Due to security concerns, only a subset of settings
     * are accessible.
     */
    getServerSettings(): IServerSettingRead;

    /**
     * Gets an instance of the Environmental Variables reader.
     * Please note: Due to security concerns, only a subset of
     * them are readable.
     */
    getEnvironmentVariables(): IEnvironmentalVariableRead;
}
