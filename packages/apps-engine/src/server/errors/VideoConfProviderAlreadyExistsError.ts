export class VideoConfProviderAlreadyExistsError implements Error {
    public name = 'VideoConfProviderAlreadyExists';

    public message: string;

    constructor(name: string) {
        this.message = `The video conference provider "${name}" was already registered by another App.`;
    }
}
