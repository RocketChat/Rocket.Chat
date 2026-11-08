import { limitOptions } from './limitOptions';

const options = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

it('offers every option while below the limit or without one', () => {
	expect(limitOptions(options, ['a'], 2)).toEqual(options);
	expect(limitOptions(options, ['a', 'b', 'c'], undefined)).toEqual(options);
});

it('offers only the selected options once the limit is reached', () => {
	expect(limitOptions(options, ['a', 'c'], 2)).toEqual([{ value: 'a' }, { value: 'c' }]);
});
