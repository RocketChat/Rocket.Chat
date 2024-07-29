export class VideoConfProviderNotRegisteredError implements Error {
    public name = 'VideoConfProviderNotRegistered';

    public message: string;

    constructor(providerName: string) {
        this.message = `The video conference provider "${providerName}" is not registered in the system.`;
    }
}
