export type MethodInvokerOptions = {
  methodId: string;
  callback?: (err?: any, result?: any) => void;
  connection: any; // Will be typed as Connection in the main file
  message: Record<string, any>;
  onResultReceived?: (err?: any, result?: any) => void;
  wait?: boolean;
  noRetry?: boolean;
};

export class MethodInvoker {
  public methodId: string;
  public sentMessage: boolean;
  public noRetry: boolean;

  protected _callback?: ((err?: any, result?: any) => void) | undefined;
  protected _connection: any;
  public _message: Record<string, any>;
  protected _onResultReceived: (err?: any, result?: any) => void;
  protected _wait: boolean;
  protected _methodResult: [any, any] | null;
  protected _dataVisible: boolean;

  constructor(options: MethodInvokerOptions) {
    this.methodId = options.methodId;
    this.sentMessage = false;

    this._callback = options.callback;
    this._connection = options.connection;
    this._message = options.message;
    this._onResultReceived = options.onResultReceived || (() => {});
    this._wait = !!options.wait;
    this.noRetry = !!options.noRetry;
    this._methodResult = null;
    this._dataVisible = false;

    // Register with the connection.
    this._connection._methodInvokers[this.methodId] = this;
  }

  public sendMessage(): void {
    if (this.gotResult()) {
      throw new Error('sendingMethod is called on method with result');
    }

    this._dataVisible = false;
    this.sentMessage = true;

    if (this._wait) {
      this._connection._methodsBlockingQuiescence[this.methodId] = true;
    }

    this._connection._send(this._message);
  }

  protected _maybeInvokeCallback(): void {
    if (this._methodResult && this._dataVisible) {
      if (this._callback) {
        this._callback(this._methodResult[0], this._methodResult[1]);
      }

      delete this._connection._methodInvokers[this.methodId];
      this._connection._outstandingMethodFinished();
    }
  }

  public receiveResult(err: any, result?: any): void {
    if (this.gotResult()) {
      throw new Error('Methods should only receive results once');
    }
    
    this._methodResult = [err, result];
    this._onResultReceived(err, result);
    this._maybeInvokeCallback();
  }

  public dataVisible(): void {
    this._dataVisible = true;
    this._maybeInvokeCallback();
  }

  public gotResult(): boolean {
    return this._methodResult !== null;
  }
}