import { backgroundBlurPlan, backgroundImageCoverScale, backgroundMatteScale } from './backgroundBlurRenderer';

it('keeps the number of compact passes bounded at the supported strengths and common camera sizes', () => {
	const radii = [6, 12, 17, 23, 35, 46, 69, 104, 138, 207];

	for (const radius of radii) {
		const plan = backgroundBlurPlan(radius);
		expect(plan.passes).toBeGreaterThanOrEqual(1);
		expect(plan.passes).toBeLessThanOrEqual(8);
	}
});

it('uses progressive passes and more downsampling only as the requested blur grows', () => {
	// Light / medium / strong at 720p.
	expect(backgroundBlurPlan(12)).toEqual({ scale: 2, passes: 2 });
	expect(backgroundBlurPlan(23)).toEqual({ scale: 2, passes: 5 });
	expect(backgroundBlurPlan(46)).toEqual({ scale: 4, passes: 5 });

	// Light / medium / strong at 1080p.
	expect(backgroundBlurPlan(17)).toEqual({ scale: 2, passes: 3 });
	expect(backgroundBlurPlan(35)).toEqual({ scale: 4, passes: 3 });
	expect(backgroundBlurPlan(69)).toEqual({ scale: 8, passes: 3 });
});

it('reduces only background working resolution when the frame budget is under pressure', () => {
	expect(backgroundBlurPlan(23, 1)).toEqual({ scale: 4, passes: 2 });
	expect(backgroundBlurPlan(23, 2)).toEqual({ scale: 8, passes: 1 });
	expect(backgroundBlurPlan(69, 1)).toEqual({ scale: 16, passes: 1 });
	expect(backgroundBlurPlan(69, 2)).toEqual({ scale: 16, passes: 1 });
});

it('refines the matte at half resolution for HD while preserving small camera inputs', () => {
	expect(backgroundMatteScale(720)).toBe(2);
	expect(backgroundMatteScale(360)).toBe(1);
	expect(backgroundMatteScale(720, 1)).toBe(4);
	expect(backgroundMatteScale(360, 2)).toBe(4);
});

it('crops replacement backgrounds centrally like object-fit cover', () => {
	expect(backgroundImageCoverScale(16, 9, 4, 3)).toEqual({ x: 1, y: 0.75 });
	expect(backgroundImageCoverScale(4, 3, 16, 9)).toEqual({ x: 0.75, y: 1 });
	expect(backgroundImageCoverScale(16, 9, 1920, 1080)).toEqual({ x: 1, y: 1 });
});
