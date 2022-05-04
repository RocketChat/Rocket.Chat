import { expect } from 'chai';

import { fileName, joinPath } from '../../../../server/lib/fileUtils';

describe('File utils', () => {
	it('should return a valid file name', () => {
		expect(fileName('something')).to.equal('something');
		expect(fileName('some@thing')).to.equal('some@thing');
		expect(fileName('/something')).to.equal('something');
		expect(fileName('/some/thing')).to.equal('some-thing');
		expect(fileName('/some/thing/')).to.equal('some-thing');
		expect(fileName('///some///thing///')).to.equal('some-thing');
		expect(fileName('some/thing')).to.equal('some-thing');
		expect(fileName('some:"thing"')).to.equal('some-thing');
		expect(fileName('some:"thing".txt')).to.equal('some-thing-.txt');
		expect(fileName('some"thing"')).to.equal('some-thing');
		expect(fileName('some\u0000thing')).to.equal('some-thing');
	});
	it('should return a valid joined path', () => {
		expect(joinPath('/app', 'some@thing')).to.equal('/app/some@thing');
		expect(joinPath('../app', 'something')).to.equal('../app/something');
		expect(joinPath('../app/', 'something')).to.equal('../app/something');
		expect(joinPath('../app/', '/something')).to.equal('../app/something');
		expect(joinPath('/app', '/something')).to.equal('/app/something');
		expect(joinPath('/app', '/../some/thing')).to.equal('/app/..-some-thing');
	});
});
