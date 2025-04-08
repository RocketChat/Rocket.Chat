import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { qrLoginStreamer } from '../qrLogin';
import { check } from 'meteor/check';

interface IQrLoginSession {
  _id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'claimed' | 'expired';
  requestingIp: string;
  approvingUserId?: string;
  loginToken?: string;
}

export const QrLoginSessions = new Mongo.Collection<IQrLoginSession>('qr_login_sessions');

export class QrLoginService {
  static readonly TOKEN_EXPIRY_MS = 5 * 60 * 1000;
  static readonly TOKEN_LENGTH = 32;
  static readonly MAX_TOKENS_PER_IP = 5;

  static getClientIP(connection?: any): string {
    if (!Meteor.isServer) return 'unknown';
    return connection?.clientAddress || 'unknown';
  }

  static async generateToken(ipAddress: string): Promise<{ token: string; expiresAt: Date }> {
    const activeTokens = await QrLoginSessions.find({
      requestingIp: ipAddress,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).countAsync();

    if (activeTokens >= this.MAX_TOKENS_PER_IP) {
      throw new Meteor.Error('too-many-requests', 'Too many active QR sessions');
    }

    const token = Random.secret(this.TOKEN_LENGTH);
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);
    
    await QrLoginSessions.insertAsync({
      _id: Random.id(),
      token,
      createdAt: new Date(),
      expiresAt,
      status: 'pending',
      requestingIp: ipAddress
    });

    return { token, expiresAt };
  }

static async validateToken(token: string, userId: string): Promise<{ success: true }> {
  const session = await QrLoginSessions.findOneAsync({ 
      token,
      expiresAt: { $gt: new Date() }
  });

  if (!session) {
      throw new Meteor.Error('invalid-session', 'QR code not found or expired');
  }

  if (session.status !== 'pending') {
      throw new Meteor.Error('invalid-state', 'QR code already used');
  }

  // Generate login token
  const { token: loginToken } = Accounts._generateStampedLoginToken();
  
  const updated = await QrLoginSessions.updateAsync({
      _id: session._id,
      status: 'pending' // Ensure we're only updating pending sessions
  }, {
      $set: {
          status: 'approved',
          approvingUserId: userId,
          approvedAt: new Date(),
          loginToken
      }
  });

  if (updated === 0) {
      throw new Meteor.Error('concurrent-modification', 'QR code was modified by another request');
  }

  qrLoginStreamer.emit(token, {
      event: 'approved',
      loginToken,
      userId
  });

  return { success: true };
}
}

Meteor.methods({
  async 'qrLogin.generateToken'() {
    if (this.userId) throw new Meteor.Error('already-authenticated');
    const ip = QrLoginService.getClientIP(this.connection);
    return QrLoginService.generateToken(ip);
  },
  
  async 'qrLogin.validateToken'(token: string) {
    check(token, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return QrLoginService.validateToken(token, this.userId);
  }
});

Meteor.startup(() => {
  QrLoginSessions.createIndexAsync({ token: 1 }, { unique: true });
  QrLoginSessions.createIndexAsync({ expiresAt: 1 });
  QrLoginSessions.createIndexAsync({ status: 1 });

  Meteor.setInterval(() => {
    QrLoginSessions.updateAsync(
      { expiresAt: { $lt: new Date() }, status: 'pending' },
      { $set: { status: 'expired' } },
      { multi: true }
    ).catch(console.error);
  }, 60_000);
});

DDPRateLimiter.addRule({
  type: 'method',
  name: 'qrLogin.generateToken',
  connectionId() { return true; }
}, 5, 60_000);