import { expect, spy } from 'chai';

import { MatrixBaseEventHandlerEE } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/handlers/BaseEvent';

describe('FederationEE - Infrastructure - Matrix - MatrixBaseEventHandlerEE', () => {
	describe('#equals()', () => {
		class MyHandler extends MatrixBaseEventHandlerEE<any> {
			public constructor(type: any) {
				super(type);
			}

			public handle(): Promise<void> {
				throw new Error('Method not implemented.');
			}
		}
		const myHandler = new MyHandler('type' as any);

		it('should return true if the type is equals to the provided one', () => {
			expect(myHandler.equals('type' as any)).to.be.true;
		});

		it('should return false if the type is different to the provided one', () => {
			expect(myHandler.equals('different' as any)).to.be.false;
		});
	});

	describe('#handle()', () => {
		const spyFn = spy();
		class MyHandler extends MatrixBaseEventHandlerEE<any> {
			public constructor(type: any) {
				super(type);
			}

			public async handle(): Promise<void> {
				spyFn();
			}
		}
		const myHandler = new MyHandler('type' as any);

		it('should call the handler fn in the implementated class', () => {
			myHandler.handle();
			expect(spyFn).to.be.called;
		});
	});
});
