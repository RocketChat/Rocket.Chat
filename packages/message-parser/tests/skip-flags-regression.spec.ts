import { parse } from '../src';

describe('Skip Flags Regression (Complexity Audit)', () => {
    const measureDepth = (depth: number) => {
        const input = '*'.repeat(depth) + 'text' + '*'.repeat(depth);
        const start = performance.now();
        parse(input);
        return performance.now() - start;
    };

    it('should demonstrate non-linear growth with nested formatting', () => {
        const times: Record<number, number> = {};
        for (let d = 1; d <= 7; d++) {
            const samples = Array.from({ length: 5 }, () => measureDepth(d)).sort((a, b) => a - b);
            times[d] = samples[Math.floor(samples.length / 2)];
        }

        console.table(Object.entries(times).map(([depth, time]) => ({ depth, 'time (ms)': time.toFixed(4) })));

        expect(times[7]).toBeGreaterThan(times[1]);
    });

    it('should handle pathological unmatched markers without crashing', () => {
        const pathological = '*_~*_~*_~*_~*_~ hello'.repeat(5);
        const start = performance.now();
        parse(pathological);
        const duration = performance.now() - start;
        console.log(`Pathological unmatched markers (5x): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(1000); // Should still finish within 1s
    });
});
