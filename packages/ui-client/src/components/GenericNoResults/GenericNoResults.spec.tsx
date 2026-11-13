import { render } from '@testing-library/react';
import GenericNoResults from './GenericNoResults';

jest.mock('@rocket.chat/fuselage', () => {
        const React = jest.requireActual('react');

        const component = (tag: string) => {
                return ({ children, ...props }: any) =>
                        React.createElement(tag, props, children);
        };

        return {
                Box: component('div'),
                States: component('div'),
                StatesIcon: component('span'),
                StatesLink: component('a'),
                StatesTitle: component('h2'),
                StatesSubtitle: component('p'),
                StatesActions: component('div'),
                StatesAction: component('button'),
        };
});

jest.mock('react-i18next', () => ({
        useTranslation: () => ({
                t: (key: string) => key,
        }),
}));

describe('GenericNoResults', () => {
        it('should mark the empty state as busy', () => {
                const { container } = render(<GenericNoResults aria-busy />);

                expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
        });

        it('should not mark the empty state as busy by default', () => {
                const { container } = render(<GenericNoResults />);

                expect(container.querySelector('[aria-busy="true"]')).toBeNull();
        });
});
