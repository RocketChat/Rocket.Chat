import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { qrLoginStreamer } from '../qrLogin';

interface IQrCodeToken {
  _id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'scanned' | 'used' | 'expired';
  userId?: string;
  ip?: string;
}

export const QrLoginTokens = new Mongo.Collection<IQrCodeToken>('rocketchat_qr_login_tokens');

export class QrLoginService {
  static readonly TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  static readonly MAX_TOKENS_PER_USER = 3;

  static async generateToken(userId: string): Promise<string> {
    // Prevent token flooding
    const activeTokens = await QrLoginTokens.find({
      userId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).countAsync();

    if (activeTokens >= this.MAX_TOKENS_PER_USER) {
      throw new Meteor.Error('too-many-tokens', 'Maximum active QR tokens reached');
    }

    const token = Random.id(32);
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);
    
    await QrLoginTokens.insertAsync({
      _id: Random.id(),
      token,
      createdAt: new Date(),
      expiresAt,
      status: 'pending',
      userId,
      ip: this.getClientIP()
    });

    return token;
  }

  static async validateAndConsumeToken(token: string, scanningUserId: string): Promise<{ loginToken: string }> {
    const qrToken = await QrLoginTokens.findOneAsync({ 
      token,
      status: { $in: ['pending', 'scanned'] },
      expiresAt: { $gt: new Date() }
    });

    if (!qrToken) {
      throw new Meteor.Error('invalid-token', 'Invalid or expired QR token');
    }

    // Step 1: Mark as scanned (if first scan)
    if (qrToken.status === 'pending') {
      await QrLoginTokens.updateAsync(
        { _id: qrToken._id },
        { $set: { status: 'scanned', userId: scanningUserId } }
      );
      
      qrLoginStreamer.emit(token, {
        event: 'scanned',
        userId: scanningUserId,
        ts: new Date()
      });
      return { loginToken: '' }; // Return empty token for scan confirmation
    }

    // Step 2: Generate session if scanned by same user
    if (qrToken.status === 'scanned' && qrToken.userId === scanningUserId) {
      const { token: loginToken } = Accounts._generateStampedLoginToken();
      
      await QrLoginTokens.updateAsync(
        { _id: qrToken._id },
        { $set: { status: 'used' } }
      );

      await Accounts._insertLoginToken(scanningUserId, {
        token: loginToken,
        when: new Date()
      });

      qrLoginStreamer.emit(token, {
        event: 'logged-in',
        userId: scanningUserId,
        ts: new Date()
      });

      return { loginToken };
    }

    throw new Meteor.Error('invalid-state', 'QR code already scanned by another device');
  }

  private static getClientIP(): string {
    return Meteor.isServer && Meteor.server.stream_server
      ? Meteor.server.stream_server.getClientIp()
      : 'unknown';
  }

  static async cleanupExpiredTokens(): Promise<void> {
    await QrLoginTokens.updateAsync(
      { expiresAt: { $lt: new Date() }, status: 'pending' },
      { $set: { status: 'expired' } },
      { multi: true }
    );
  }
}

Meteor.methods({
  async 'qrLogin.generateToken'() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return QrLoginService.generateToken(this.userId);
  },
  
  async 'qrLogin.validateToken'(token: string) {
    check(token, String);
    return QrLoginService.validateAndConsumeToken(token, this.userId || '');
  }
});

// Security & Maintenance
Meteor.startup(() => {
  // Create indexes
  QrLoginTokens.createIndexAsync({ token: 1 }, { unique: true });
  QrLoginTokens.createIndexAsync({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  QrLoginTokens.createIndexAsync({ userId: 1 });
  QrLoginTokens.createIndexAsync({ status: 1 });

  // Regular cleanup
  Meteor.setInterval(
    () => QrLoginService.cleanupExpiredTokens().catch(console.error),
    QrLoginService.TOKEN_EXPIRY_MS
  );
});

// Rate limiting
DDPRateLimiter.addRule({
  type: 'method',
  name: 'qrLogin.validateToken',
  userId(userId) {
    return !userId; // Only limit unauthenticated calls
  }
}, 5, 60000); // 5 attempts per minute