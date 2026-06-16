import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const stubbedSettings = { get: sinon.stub() };
const stubbedUsers = { findOneByEmailAddress: sinon.stub() };
const stubbedAccounts = { sendResetPasswordEmail: sinon.stub() };

const { sendForgotPasswordEmail } = proxyquire.noCallThru().load('./sendForgotPasswordEmail', {
  '../../app/settings/server': { settings: stubbedSettings },
  '@rocket.chat/models': { Users: stubbedUsers },
  'meteor/accounts-base': { Accounts: stubbedAccounts },
  'meteor/check': { check: sinon.stub() },
  'meteor/meteor': { Meteor: { methods: sinon.stub() } },
  '../lib/logger/system': { SystemLogger: { error: sinon.stub() } },
});

describe('sendForgotPasswordEmail()', () => {
  beforeEach(() => {
    stubbedSettings.get.reset();
    stubbedUsers.findOneByEmailAddress.reset();
    stubbedAccounts.sendResetPasswordEmail.reset();
  });

  it('returns true when user is not found', async () => {
    stubbedUsers.findOneByEmailAddress.resolves(undefined);
    const result = await sendForgotPasswordEmail('notfound@example.com');
    expect(result).to.be.true;
    expect(stubbedAccounts.sendResetPasswordEmail.called).to.be.false;
  });

  it('returns false when Accounts_AllowPasswordChange is false', async () => {
    stubbedUsers.findOneByEmailAddress.resolves({ _id: 'userId', services: { password: { bcrypt: 'hash' } } });
    stubbedSettings.get.withArgs('Accounts_AllowPasswordChange').returns(false);
    const result = await sendForgotPasswordEmail('user@example.com');
    expect(result).to.be.false;
    expect(stubbedAccounts.sendResetPasswordEmail.called).to.be.false;
  });

  it('returns false when user is OAuth-only and Accounts_AllowPasswordChangeForOAuthUsers is false', async () => {
    stubbedUsers.findOneByEmailAddress.resolves({ _id: 'userId', services: { github: {} } });
    stubbedSettings.get.withArgs('Accounts_AllowPasswordChange').returns(true);
    stubbedSettings.get.withArgs('Accounts_AllowPasswordChangeForOAuthUsers').returns(false);
    const result = await sendForgotPasswordEmail('oauthuser@example.com');
    expect(result).to.be.false;
    expect(stubbedAccounts.sendResetPasswordEmail.called).to.be.false;
  });

  it('sends email and returns true when password change is allowed', async () => {
    stubbedUsers.findOneByEmailAddress.resolves({ _id: 'userId', services: { password: { bcrypt: 'hash' } } });
    stubbedSettings.get.withArgs('Accounts_AllowPasswordChange').returns(true);
    stubbedAccounts.sendResetPasswordEmail.returns(undefined);
    const result = await sendForgotPasswordEmail('user@example.com');
    expect(result).to.be.true;
    expect(stubbedAccounts.sendResetPasswordEmail.calledOnce).to.be.true;
    expect(stubbedAccounts.sendResetPasswordEmail.calledWith('userId', 'user@example.com')).to.be.true;
  });
});
