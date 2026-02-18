import { expect } from 'chai';
import type { IAuthorization } from '../src/types/IAuthorization';

describe('Authorization Service - 2FA', () => {
    it('should have disable2FA method defined in the interface', () => {
        const methodName: keyof IAuthorization = 'disable2FA';
        expect(methodName).to.equal('disable2FA');
    });
});