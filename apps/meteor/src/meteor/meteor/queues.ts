import { _debug } from './debug.ts';

export class AsynchronousQueue {
  private _runTask: Promise<any>;

  constructor() {
    this._runTask = Promise.resolve();
  }

  runTask(task: () => any): Promise<any> {
    this._runTask = this._runTask.then(task).catch((e) => {
      _debug('Exception in defer callback', e);
    });
    return this._runTask;
  }

  queueTask(task: () => any): Promise<any> {
    return this.runTask(task);
  }

  flush(): Promise<any> {
    return this._runTask;
  }

  drain(): Promise<any> {
    return this.flush();
  }
}

export class SynchronousQueue {
  private _tasks: Array<() => void>;
  private _running: boolean;

  constructor() {
    this._tasks = [];
    this._running = false;
  }

  runTask(task: () => void) {
    this.queueTask(task);
    this.drain();
  }

  queueTask(task: () => void) {
    this._tasks.push(task);
  }

  flush() {
    this.drain();
  }

  drain() {
    if (this._running) return;
    this._running = true;
    try {
      while (this._tasks.length > 0) {
        const task = this._tasks.shift();
        if (task) {
          try {
            task();
          } catch (e) {
            _debug('Exception in callback', e);
          }
        }
      }
    } finally {
      this._running = false;
    }
  }
}