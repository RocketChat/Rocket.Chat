import { distanceFromBottom, isAtBottom, isNearNewerEdge, isNearOlderEdge } from './geometry';

const geometry = (scrollTop: number) => ({ scrollTop, scrollHeight: 2000, clientHeight: 600 });

describe('geometry', () => {
	it('should measure the distance left to the bottom', () => {
		expect(distanceFromBottom(geometry(1000))).toBe(400);
	});

	it('should tolerate a sub-pixel distance at the bottom', () => {
		expect(isAtBottom(geometry(1400))).toBe(true);
		expect(isAtBottom(geometry(1399.2))).toBe(true);
		expect(isAtBottom(geometry(1398))).toBe(false);
	});

	it('should consider a list shorter than the viewport at the bottom', () => {
		expect(isAtBottom({ scrollTop: 0, scrollHeight: 300, clientHeight: 600 })).toBe(true);
	});

	it('should load older messages within a third of the viewport from the first message', () => {
		expect(isNearOlderEdge(geometry(250), 50)).toBe(true);
		expect(isNearOlderEdge(geometry(251), 50)).toBe(false);
	});

	it('should load newer messages only at the bottom', () => {
		expect(isNearNewerEdge(geometry(1400))).toBe(true);
		expect(isNearNewerEdge(geometry(1300))).toBe(false);
	});
});
