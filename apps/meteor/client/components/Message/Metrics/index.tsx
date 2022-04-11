import Metrics from './Metrics';
import MetricsFollowing from './MetricsFollowing';
import MetricsItem from './MetricsItem';
import MetricsItemIcon from './MetricsItemIcon';
import MetricsItemLabel from './MetricsItemLabel';

export default Object.assign(Metrics, {
	Item: Object.assign(MetricsItem, {
		Label: MetricsItemLabel,
		Icon: MetricsItemIcon,
	}),
	Following: MetricsFollowing,
});
