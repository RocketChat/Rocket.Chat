import { waitForElement } from './waitForElement';

beforeEach(() => {
	document.body.innerHTML = `<span class="ready" />`;
});

it('should return the element when it is already in the dom', async () => {
	expect(await waitForElement('.ready')).toBe(document.querySelector('.ready'));
});

it('should await until the element be in the dom and return it', async () => {
	setTimeout(() => {
		const element = document.createElement('div');
		element.setAttribute('class', 'not-ready');
		document.body.appendChild(element);
	}, 5);
	expect(await waitForElement('.not-ready')).toBe(document.querySelector('.not-ready'));
});
