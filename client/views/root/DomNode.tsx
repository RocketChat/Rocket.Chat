import React, { FC, useLayoutEffect, useRef } from 'react';

type DomNodeProps = {
	node: Node;
};

const hiddenStyle = { display: 'none' } as const;

const DomNode: FC<DomNodeProps> = ({ node }) => {
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!ref.current || !ref.current.parentNode) {
			return;
		}

		const container = ref.current.parentNode;
		const sibling = ref.current;

		container.insertBefore(node, sibling);

		return (): void => {
			container.removeChild(node);
		};
	}, [node]);

	return <div ref={ref} style={hiddenStyle} />;
};

export default DomNode;
