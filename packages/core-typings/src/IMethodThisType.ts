import type { ISocketConnection } from './ISocketConnection';

export interface IMethodConnection {
  id: string;
  close(fn: (...args: any[]) => void): void;
  onClose(fn: (...args: any[]) => void): void;
  clientAddress: string;
  httpHeaders: Record<string, any>;
}

export interface IMethodThisType {
  isSimulation: boolean;
  userId: string | null;
  connection: ISocketConnection | null;
  setUserId(userId: string): void;
  unblock(): void;
  twoFactorChecked: boolean | undefined;
}
