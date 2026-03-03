import { DDPCommon } from 'meteor/ddp-common';
import { Meteor } from 'meteor/meteor';
import { Hook } from 'meteor/callback-hook';

// Export an array to track connections for _allSubscriptionsReady
export const allConnections: any[] = [];

export const DDP: any = {
  ConnectionError: class ConnectionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DDP.ConnectionError';
    }
  },
  ForcedReconnectError: class ForcedReconnectError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'DDP.ForcedReconnectError';
    }
  },
  _reconnectHook: new Hook({ bindEnvironment: false }),
  onReconnect: (callback: any) => DDP._reconnectHook.register(callback),
  _allSubscriptionsReady: () => allConnections.every((conn) => Object.values(conn._subscriptions).every((sub: any) => sub.ready)),
  
  randomStream: (name?: string) => {
    const scope = DDP._CurrentMethodInvocation?.get();
    return DDPCommon.RandomStream.get(scope, name);
  }
};

// LAZY INITIALIZATION: Fixes the "Cannot access 'Meteor' before initialization" error
const lazyEnvVar = (key: string) => {
  let instance: any;
  Object.defineProperty(DDP, key, {
    get() {
      if (!instance) instance = new Meteor.EnvironmentVariable();
      return instance;
    },
    set(val) { instance = val; },
    enumerable: true,
    configurable: true
  });
};

lazyEnvVar('_CurrentMethodInvocation');
lazyEnvVar('_CurrentPublicationInvocation');
lazyEnvVar('_CurrentCallAsyncInvocation');

Object.defineProperty(DDP, '_CurrentInvocation', {
  get() { return DDP._CurrentMethodInvocation; },
  set(val) { DDP._CurrentMethodInvocation = val; }
});