export class MustExtendAppError implements Error {
    public name = 'MustExtendApp';

    public message = 'App must extend the "App" abstract class.';
}
