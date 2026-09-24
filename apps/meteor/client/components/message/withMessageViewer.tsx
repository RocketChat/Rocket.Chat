import type { ComponentType } from 'react';

import { MessageViewerProvider, useOptionalMessageViewer } from './MessageViewer';

/** Renders a message part under the list's viewer, or under one of its own when rendered outside a list */
export const withMessageViewer = <TProps extends object>(Component: ComponentType<TProps>) => {
	const WithMessageViewer = (props: TProps) => {
		const viewer = useOptionalMessageViewer();

		if (!viewer) {
			return (
				<MessageViewerProvider>
					<Component {...props} />
				</MessageViewerProvider>
			);
		}

		return <Component {...props} />;
	};

	WithMessageViewer.displayName = `withMessageViewer(${Component.displayName ?? Component.name})`;

	return WithMessageViewer;
};
