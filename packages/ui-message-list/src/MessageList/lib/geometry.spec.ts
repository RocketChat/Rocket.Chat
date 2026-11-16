import { distanceFromBottom, isAtBottom, isNearNewerEdge, isNearOlderEdge } from './geometry';

const geometry = (scrollTop: number) => ({ scrollTop, scrollHeight: 2000, clientHeight: 600 });

describe('geometry', () => {
	it('should measure the distance left to the bottom', () => {
		expect(distanceFromBottom(geometry(1000))).toBe(400);
	});

	it('should tolerate a sub-pixel distance at the bottom (R17)', () => {
		expect(isAtBottom(geometry(1400))).toBe(true);
		expect(isAtBottom(geometry(1399.2))).toBe(true);
		expect(isAtBottom(geometry(1398))).toBe(false);
	});

	it('should consider a list shorter than the viewport at the bottom (R14)', () => {
		expect(isAtBottom({ scrollTop: 0, scrollHeight: 300, clientHeight: 600 })).toBe(true);
	});

	it('should load older messages within a third of the viewport from the first message (R30)', () => {
		expect(isNearOlderEdge(geometry(250), 50)).toBe(true);
		expect(isNearOlderEdge(geometry(251), 50)).toBe(false);
	});

	it('should load newer messages only at the bottom (R31)', () => {
		expect(isNearNewerEdge(geometry(1400))).toBe(true);
		expect(isNearNewerEdge(geometry(1300))).toBe(false);
	});

	it('should count the distance within the threshold as the bottom, for the bottom and for the newer edge (R17, R80)', () => {
		expect(isAtBottom(geometry(1340), 60)).toBe(true);
		expect(isAtBottom(geometry(1339), 60)).toBe(false);
		expect(isNearNewerEdge(geometry(1340), 60)).toBe(true);
		expect(isNearNewerEdge(geometry(1339), 60)).toBe(false);
		expect(isAtBottom(geometry(1340))).toBe(false);
	});
});
