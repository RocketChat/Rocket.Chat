import type {
  IMessage,
  ILivechatTrigger,
  ILivechatAgent,
} from '@rocket.chat/core-typings';

/* ------------------ Alerts ------------------ */
export interface LivechatAlert {
  id: string;
  text: string;
  severity?: 'info' | 'warning' | 'error';
}

/* ------------------ Queue Info ------------------ */
export interface LivechatQueueInfo {
  position?: number;
  estimatedWaitTime?: number;
}

/* ------------------ Config ------------------ */
export interface LivechatConfig {
  allowSwitchingDepartments?: boolean;
  showConnecting?: boolean;
  limitTextLength?: number;
}

/* ------------------ Modal ------------------ */
export interface LivechatModalState {
  open: boolean;
  type?: string;
  payload?: unknown; // unknown > any (safer)
}
