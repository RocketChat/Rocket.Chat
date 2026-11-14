export class ConfigurationManager {
    private static instance: ConfigurationManager;

    private configurations: Map<string, any>;

    private constructor() {
        this.configurations = new Map();
    }

    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    public set(key: string, value: any): void {
        this.configurations.set(key, value);
    }

    public get(key: string): any {
        return this.configurations.get(key);
    }


    public delete(key: string): void {
        this.configurations.delete(key);
    }

    
    public clear(): void {
        this.configurations.clear();
    }
}
