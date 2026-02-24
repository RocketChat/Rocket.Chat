import { expect } from 'chai';
import sinon from 'sinon';
import { Users } from '@rocket.chat/models';
import { TOTP } from '../../../app/2fa/server/lib/totp';
import * as notifyListener from '../../../app/lib/server/lib/notifyListener';
import { Authorization } from './service';

describe('Authorization Service - disable2FA', () => {
    let service: Authorization;

    beforeEach(() => {
        service = new Authorization();

        sinon.stub(Users, 'findOneById');
        sinon.stub(TOTP, 'verify');
        sinon.stub(Users, 'disable2FAByUserId');
        sinon.stub(notifyListener, 'notifyOnUserChange');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should throw "error-invalid-user" if user does not exist', async () => {
        (Users.findOneById as sinon.SinonStub).resolves(null);

        try {
            await service.disable2FA('fake_uid', 'code');
            expect.fail('Should have thrown an error');
        } catch (err: any) {
            expect(err.error).to.equal('error-invalid-user');
        }

        expect((Users.disable2FAByUserId as sinon.SinonStub).called).to.be.false;
    });

    it('should return false if 2FA is already disabled', async () => {
        (Users.findOneById as sinon.SinonStub).resolves({ services: { totp: { enabled: false } } });

        const result = await service.disable2FA('fake_uid', 'code');

        expect(result).to.be.false;
        expect((Users.disable2FAByUserId as sinon.SinonStub).called).to.be.false;
    });

    it('should throw "invalid-totp" if verification fails', async () => {
        (Users.findOneById as sinon.SinonStub).resolves({
            services: { totp: { enabled: true, secret: 'secret' } }
        });
        (TOTP.verify as sinon.SinonStub).resolves(false);

        try {
            await service.disable2FA('fake_uid', 'wrong_code');
            expect.fail('Should have thrown an error');
        } catch (err: any) {
            expect(err.error).to.equal('invalid-totp');
        }

        expect((Users.disable2FAByUserId as sinon.SinonStub).called).to.be.false;
    });

    it('should execute actual behavior: call DB update with exact parameters on success', async () => {
        const testUid = 'valid_uid';
        (Users.findOneById as sinon.SinonStub).resolves({ 
            services: { totp: { enabled: true, secret: 'secret', hashedBackup: [] } } 
        });
        (TOTP.verify as sinon.SinonStub).resolves(true);
        (Users.disable2FAByUserId as sinon.SinonStub).resolves({ modifiedCount: 1 });
        
        const result = await service.disable2FA(testUid, 'correct_code');
        
        expect(result).to.be.true;
        
        // Verify DB update was called with the EXACT userId
        expect((Users.disable2FAByUserId as sinon.SinonStub).calledOnceWithExactly(testUid)).to.be.true;
    });
});