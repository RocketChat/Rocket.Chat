import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import styled from './styled';

it('should create a styled component', () => {
	const component = styled('div')`
		color: rebeccapurple;
	`;

	render(createElement(component));

	const styleElement = document.getElementsByTagName('style')[0];
	expect(styleElement.textContent).toMatch(/\{color:rebeccapurple;\}/);
});

it('should create a styled component with props', () => {
	const component = styled('div', ({ foo: _foo, ...props }: { foo: string }) => props)`
		color: ${(props) => props.foo};
	`;

	render(createElement(component, { foo: 'rebeccapurple', lang: 'pt-BR' }, 'content'));

	const styleElement = document.getElementsByTagName('style')[0];
	expect(styleElement.textContent).toMatch(/\{color:rebeccapurple;\}/);
	expect(screen.getByText('content')).toHaveAttribute('lang', 'pt-BR');
});
