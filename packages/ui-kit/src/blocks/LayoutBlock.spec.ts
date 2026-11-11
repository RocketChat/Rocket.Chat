import type { LayoutBlock } from './LayoutBlock.js';
import type { LayoutBlockish } from './LayoutBlockish.js';

it('should have the same shape of `LayoutBlockish<{}>`', () => {
	expect<Expect<Required<LayoutBlock> extends Required<LayoutBlockish<object>> ? true : false>>(true).toBeTruthy();
});
