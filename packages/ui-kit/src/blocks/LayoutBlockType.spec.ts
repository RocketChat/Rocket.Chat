import type { LayoutBlock } from './LayoutBlock';
import type { LayoutBlockType } from './LayoutBlockType';

it("should be enum for `LayoutBlock['type']`", () => {
	expect<Expect<EnumToMatchTaggedUnionTags<typeof LayoutBlockType, LayoutBlock, 'type'>>>(true).toBeTruthy();
});
