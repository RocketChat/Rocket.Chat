import { PureComponent } from 'react';

class PortalWrapper extends PureComponent {
	state = { errored: false }

	static getDerivedStateFromError = () => ({ errored: true })

	componentDidCatch = () => {}

	render = () => (this.state.errored ? null : this.props.portal)
}

export default PortalWrapper;
