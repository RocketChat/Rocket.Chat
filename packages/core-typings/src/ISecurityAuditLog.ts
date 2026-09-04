export interface ISecurityAuditLog {
    _id: string;
    userId: string;
    ipAddress: string;
    timestamp: Date;
    inactiveReason: 'deactivated' | 'idle_too_long' | 'pending_approval';
    actionTaken?: 'none' | 'password_reset_forced' | 'account_locked';
}