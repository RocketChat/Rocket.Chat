import { getTargetBoundaries } from './getTargetBoundaries';
import { withResizeObserverMock } from '../../mocks/withResizeObserverMock';

withResizeObserverMock();

const anchorRect: DOMRect = {
	bottom: 300,
	height: 100,
	left: 0,
	right: 100,
	top: 200,
	width: 100,
	x: 0,
	y: 200,
	toJSON() {
		return this;
	},
};

const targetRect: DOMRect = {
	bottom: 50,
	height: 50,
	left: 0,
	right: 50,
	top: 0,
	width: 50,
	x: 0,
	y: 0,
	toJSON() {
		return this;
	},
};

it('should work', () => {
	const targetBoundaries = getTargetBoundaries({
		anchorRect,
		targetRect,
	});
	expect(targetBoundaries.t).toEqual(150);
	expect(targetBoundaries.b).toEqual(300);
	expect(targetBoundaries.r).toEqual(100);
	expect(targetBoundaries.l).toEqual(-50);
});
