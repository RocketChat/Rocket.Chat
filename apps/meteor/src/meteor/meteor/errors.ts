export class MeteorError extends Error {
  public error: string | number;
  public reason?: string | undefined;
  public details?: string | undefined;
  public errorType = 'Meteor.Error';
  public isClientSafe = true;

  constructor(error: string | number, reason?: string, details?: string) {
    const message = reason ? `${reason} [${error}]` : `[${error}]`;
    super(message);
    
    this.error = error;
    this.reason = reason;
    this.details = details;

    // Maintain correct prototype chain in TS when extending native Error
    Object.setPrototypeOf(this, MeteorError.prototype);
  }

  clone(): MeteorError {
    return new MeteorError(this.error, this.reason, this.details);
  }
}