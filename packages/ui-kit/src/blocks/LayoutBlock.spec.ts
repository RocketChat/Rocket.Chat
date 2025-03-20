import type { LayoutBlock } from './LayoutBlock';
import type { LayoutBlockish } from './LayoutBlockish';

it('should have the same shape of `LayoutBlockish<{}>`', () => {
	expect<Expect<Required<LayoutBlock> extends Required<LayoutBlockish<object>> ? true : false>>(true).toBeTruthy();
});
