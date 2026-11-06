import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { render } from '@testing-library/react';
import type { Ref, RefCallback } from 'react';
import { createRef, useCallback } from 'react';

import { useMergedRefsV2 } from './useMergedRefsV2';

const useTrackedRef = (events: string[], name: string): RefCallback<HTMLElement> =>
	useCallback(
		(node: HTMLElement) => {
			events.push(`${name}:attach:${node.tagName}`);
			return () => {
				events.push(`${name}:detach`);
			};
		},
		[events, name],
	);

describe('useMergedRefsV2', () => {
	it('should attach every ref and run each cleanup on unmount', () => {
		const events: string[] = [];
		const objectRef = createRef<HTMLElement>();
		const legacyRef = jest.fn();

		const Component = () => {
			const ref = useMergedRefsV2(useTrackedRef(events, 'a'), useTrackedRef(events, 'b'), objectRef, legacyRef as Ref<HTMLElement>);
			return <div ref={ref} />;
		};

		const { unmount } = render(<Component />);

		expect(events).toEqual(['a:attach:DIV', 'b:attach:DIV']);
		expect(objectRef.current).toBeInstanceOf(HTMLDivElement);
		expect(legacyRef).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));

		unmount();

		expect(events).toEqual(['a:attach:DIV', 'b:attach:DIV', 'a:detach', 'b:detach']);
		expect(objectRef.current).toBeNull();
		expect(legacyRef).toHaveBeenLastCalledWith(null);
	});

	it('should rebind when one of the refs changes', () => {
		const events: string[] = [];

		const Component = ({ name }: { name: string }) => {
			const ref = useMergedRefsV2(useTrackedRef(events, name));
			return <div ref={ref} />;
		};

		const { rerender } = render(<Component name='a' />);
		rerender(<Component name='b' />);

		expect(events).toEqual(['a:attach:DIV', 'a:detach', 'b:attach:DIV']);
	});

	it('should tear down when merged again by a ref helper that calls it with null', () => {
		const events: string[] = [];

		const Component = () => {
			const ref = useMergedRefs(useMergedRefsV2(useTrackedRef(events, 'a')));
			return <div ref={ref} />;
		};

		const { unmount } = render(<Component />);
		unmount();

		expect(events).toEqual(['a:attach:DIV', 'a:detach']);
	});
});
