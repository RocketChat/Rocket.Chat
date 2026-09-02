import { ConfigurationManager } from './configurationManager';
import { Logger } from './logger';

export class ConfigService {
    private configurationManager: ConfigurationManager;

    constructor() {
        this.configurationManager = ConfigurationManager.getInstance();
    }
    

    public setConfig(key: string, value: any): void {
        Logger.log(`Setting config: ${key} = ${value}`);
        this.configurationManager.set(key, value);
    }

    public getConfig(key: string): any {
        Logger.log(`Getting config: ${key}`);
        return this.configurationManager.get(key);
    }

    public deleteConfig(key: string): void {
        Logger.log(`Deleting config: ${key}`);
        this.configurationManager.delete(key);
    }
}
