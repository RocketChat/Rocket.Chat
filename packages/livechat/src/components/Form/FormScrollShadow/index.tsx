import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

export const FormScrollShadow = ({
	topRef,
	bottomRef,
	children,
}: {
	children: ComponentChildren;
	topRef: RefObject<HTMLDivElement>;
	bottomRef: RefObject<HTMLDivElement>;
}) => {
	const [atTop, setAtTop] = useState(true);
	const [atBottom, setAtBottom] = useState(false);

	const callback: IntersectionObserverCallback = (entries) => {
		entries.forEach((entry) => {
			entry.target.id === 'top' && setAtTop(entry.isIntersecting);
			entry.target.id === 'bottom' && setAtBottom(entry.isIntersecting);
		});
	};

	useEffect(() => {
		if (!topRef?.current || !bottomRef?.current) {
			return;
		}
		const observer = new IntersectionObserver(callback, {
			root: document.getElementById('scrollShadow'),
			rootMargin: '0px',
			threshold: 0.1,
		});
		if (topRef.current) {
			observer.observe(topRef.current);
		}
		if (bottomRef.current) {
			observer.observe(bottomRef.current);
		}
		return () => {
			observer.disconnect();
		};
	}, [bottomRef, topRef]);

	return (
		<div id='scrollShadow' className={createClassName(styles, 'scrollShadow', { atTop, atBottom })}>
			{children}
		</div>
	);
};
