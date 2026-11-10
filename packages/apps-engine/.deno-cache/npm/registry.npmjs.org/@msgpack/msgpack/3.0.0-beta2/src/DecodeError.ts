export class DecodeError extends Error {
  constructor(message: string) {
    super(message);

    // fix the prototype chain in a cross-platform way
    const proto: typeof DecodeError.prototype = Object.create(DecodeError.prototype);
    Object.setPrototypeOf(this, proto);

    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: DecodeError.name,
    });
  }
}
