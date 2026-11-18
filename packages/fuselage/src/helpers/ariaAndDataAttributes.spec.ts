import { ariaAndDataAttributes } from './ariaAndDataAttributes';

it('keeps every aria-* and data-* attribute and nothing else', () => {
	const props = { 'aria-label': 'Save', 'aria-colcount': 2, 'data-qa': 'save', 'className': 'mine', 'onPress': () => undefined };

	expect(ariaAndDataAttributes(props)).toEqual({ 'aria-label': 'Save', 'aria-colcount': 2, 'data-qa': 'save' });
});

it('renders the testID as data-testid', () => {
	expect(ariaAndDataAttributes({ testID: 'save' })).toEqual({ 'data-testid': 'save' });
});

it('lets a data-testid the consumer passed win over the testID', () => {
	expect(ariaAndDataAttributes({ 'testID': 'save', 'data-testid': 'legacy' })).toEqual({ 'data-testid': 'legacy' });
});
