import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import styled from './styled';

it('should create a styled component', () => {
	const component = styled('div')`
		color: rebeccapurple;
	`;

	render(createElement(component, { title: 'styled' }));

	expect(screen.getByTitle('styled')).toHaveStyle({ color: 'rgb(102, 51, 153)' });
});

it('should create a styled component with props', () => {
	const component = styled('div', ({ foo: _foo, ...props }: { foo: string }) => props)`
		color: ${(props) => props.foo};
	`;

	render(createElement(component, { foo: 'rebeccapurple', lang: 'pt-BR', title: 'styled' }));

	const element = screen.getByTitle('styled');
	expect(element).toHaveStyle({ color: 'rgb(102, 51, 153)' });
	expect(element).toHaveAttribute('lang', 'pt-BR');
});
