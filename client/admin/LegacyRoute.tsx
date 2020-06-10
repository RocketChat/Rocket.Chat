import React, { useEffect, useRef, FC, useState } from 'react';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import PageSkeleton from './PageSkeleton';

type LegacyRouteProps = {
	action: () => Promise<string>;
};

const LegacyRoute: FC<LegacyRouteProps> = ({ action }) => {
	const [template, setTemplate] = useState<Blaze.Template>();
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let mounted = true;
		let view: Blaze.View;

		action().then((templateName) => {
			if (!mounted || !wrapperRef.current || !templateName) {
				return;
			}

			setTemplate(Template[templateName]);
			view = Blaze.render(Template[templateName], wrapperRef.current);
		});

		return (): void => {
			mounted = false;
			Blaze.remove(view);
		};
	}, [action]);

	return <>
		<div ref={wrapperRef} />
		{!template && <PageSkeleton />}
	</>;
};

export default LegacyRoute;
