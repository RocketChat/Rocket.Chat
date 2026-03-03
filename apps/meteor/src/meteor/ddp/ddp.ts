// If you are using standard standard Meteor types, you can import SubscriptionHandle:
// import type { SubscriptionHandle } from 'meteor/meteor';
// Otherwise, a standard representation is:
export interface SubscriptionHandle {
  stop(): void;
  ready(): boolean;
}

export type DDPConnectionStatus = 
  | 'connected' 
  | 'connecting' 
  | 'failed' 
  | 'waiting' 
  | 'offline';

export interface DDPStatus {
  connected: boolean;
  status: DDPConnectionStatus;
  retryCount: number;
  retryTime?: number;
  reason?: string;
}

export interface DDPStatic {
  subscribe(name: string, ...rest: any[]): SubscriptionHandle;
  call(method: string, ...parameters: any[]): any;
  callAsync(method: string, ...parameters: any[]): Promise<any>;
  apply(method: string, ...parameters: any[]): any;
  methods(methodsDictionary: Record<string, Function>): any;
  status(): DDPStatus;
  reconnect(): void;
  disconnect(): void;
  onReconnect(): void;
}

/**
 * Modern implementation of the DDP umbrella export.
 * In a fully demeteorized setup, this would directly re-export the `connect` 
 * method from your modernized `ddp-client` package.
 */
export interface DDP {
  _allSubscriptionsReady(): boolean;
  connect(url: string): DDPStatic;
}

// ==========================================
// DDPCommon Types (Aligned with ddp-common.ts)
// ==========================================

export interface MethodInvocationOptions {
  name: string;
  userId: string | null;
  setUserId?: (newUserId: string | null) => void | Promise<void>;
  isSimulation: boolean;
  connection: any; // Replaces Meteor.Connection
  randomSeed: string;
}

export interface MethodInvocation {
  name: string;
  userId: string | null;
  isSimulation: boolean;
  connection: any;
  
  unblock(): void;
  setUserId(userId: string | null): void | Promise<void>;
}