import { expect } from 'chai';

import { PatchCoordinator } from '../src';

describe('PatchCoordinator', () => {
	describe('Make a simple function', () => {
		it('should execute the function passed as argument', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			expect(fn).to.throw('function was called');
		});

		it('should return the result of the internal function', () => {
			const fn = PatchCoordinator.makeFunction(() => 15);

			expect(fn()).to.be.equal(15);
		});
	});

	describe('Replace a simple function', () => {
		it('should execute the patched function', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			PatchCoordinator.addPatch(fn, () => {
				throw new Error('patch was called');
			});

			expect(fn).to.throw('patch was called');
		});

		it('should return the result of the patched function', () => {
			const fn = PatchCoordinator.makeFunction(() => 15);

			PatchCoordinator.addPatch(fn, () => 20);

			expect(fn()).to.be.equal(20);
		});
	});

	describe('Remove a patch', () => {
		it('should execute the function passed as argument', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			const remove = PatchCoordinator.addPatch(fn, () => {
				throw new Error('patch was called');
			});

			expect(fn).to.throw('patch was called');

			remove();

			expect(fn).to.throw('function was called');
		});

		it('should return the result of the internal function', () => {
			const fn = PatchCoordinator.makeFunction(() => 15);

			const remove = PatchCoordinator.addPatch(fn, () => 20);

			expect(fn()).to.be.equal(20);

			remove();

			expect(fn()).to.be.equal(15);
		});
	});

	describe('Patch Condition', () => {
		it('should execute either function depending if the patch is enabled or not', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			let enabled = false;

			PatchCoordinator.addPatch(
				fn,
				() => {
					throw new Error('patch was called');
				},
				() => enabled,
			);

			expect(fn).to.throw('function was called');
			enabled = true;
			expect(fn).to.throw('patch was called');
			enabled = false;
			expect(fn).to.throw('function was called');
		});

		it('should return the value of the right function based on the condition', () => {
			const fn = PatchCoordinator.makeFunction(() => 15);

			let enabled = false;

			PatchCoordinator.addPatch(
				fn,
				() => 20,
				() => enabled,
			);

			expect(fn()).to.be.equal(15);
			enabled = true;
			expect(fn()).to.be.equal(20);
			enabled = false;
			expect(fn()).to.be.equal(15);
		});
	});

	describe('Chained calls', () => {
		it('Should call the inner function', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			PatchCoordinator.addPatch(fn, (next) => {
				next();
				throw new Error('patch was called');
			});

			expect(fn).to.throw('function was called');
		});

		it('should return the sum of values', () => {
			const fn = PatchCoordinator.makeFunction(() => 15);

			PatchCoordinator.addPatch(fn, (next) => 20 + next());

			expect(fn()).to.be.equal(35);
		});
	});

	describe('Multiple patches', () => {
		it('Should call the right version of the function', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			const remove = PatchCoordinator.addPatch(fn, () => {
				throw new Error('patch was called');
			});

			const remove2 = PatchCoordinator.addPatch(fn, () => {
				throw new Error('second patch was called');
			});

			expect(fn).to.throw('second patch was called');
			remove2();
			expect(fn).to.throw('patch was called');
			remove();
			expect(fn).to.throw('function was called');
		});

		it('Should respect conditions and removals', () => {
			const fn = PatchCoordinator.makeFunction(() => {
				throw new Error('function was called');
			});

			let enabled = true;
			let enabled2 = true;

			const remove = PatchCoordinator.addPatch(
				fn,
				() => {
					throw new Error('patch was called');
				},
				() => enabled,
			);

			const remove2 = PatchCoordinator.addPatch(
				fn,
				() => {
					throw new Error('second patch was called');
				},
				() => enabled2,
			);

			expect(fn).to.throw('second patch was called');
			enabled2 = false;
			expect(fn).to.throw('patch was called');
			enabled = false;
			expect(fn).to.throw('function was called');
			enabled2 = true;
			expect(fn).to.throw('second patch was called');
			enabled = true;
			remove2();
			expect(fn).to.throw('patch was called');
			remove();
			expect(fn).to.throw('function was called');
		});

		it('should chain on the right order', () => {
			const fn = PatchCoordinator.makeFunction(() => [1]);

			let enabled2 = true;
			let enabled3 = true;
			let enabled4 = true;

			PatchCoordinator.addPatch(
				fn,
				(next) => [2].concat(next()),
				() => enabled2,
			);
			const remove3 = PatchCoordinator.addPatch(
				fn,
				(next) => [3].concat(next()),
				() => enabled3,
			);
			PatchCoordinator.addPatch(
				fn,
				(next) => [4].concat(next()),
				() => enabled4,
			);

			expect(fn()).to.be.an('array').deep.equal([4, 3, 2, 1]);

			enabled2 = false;
			expect(fn()).to.be.an('array').deep.equal([4, 3, 1]);
			enabled4 = false;
			expect(fn()).to.be.an('array').deep.equal([3, 1]);
			enabled3 = false;
			expect(fn()).to.be.an('array').deep.equal([1]);
			enabled3 = true;
			expect(fn()).to.be.an('array').deep.equal([3, 1]);
			remove3();
			expect(fn()).to.be.an('array').deep.equal([1]);
			enabled2 = true;
			enabled4 = true;
			expect(fn()).to.be.an('array').deep.equal([4, 2, 1]);
		});
	});
});
