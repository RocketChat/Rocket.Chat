import React from 'react';

export function mapProps(Component) {
	const WrappedComponent = ({ msg, username, tcount, ts, ...props }) => (
		<Component replies={tcount} username={username} msg={msg} ts={ts} {...props} />
	);

	WrappedComponent.displayName = `mapProps(${Component.displayName ?? Component.name ?? 'Component'})`;

	return WrappedComponent;
}
