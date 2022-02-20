import './engagementDashboard';
import './seatsCap';
import './services';

const { TRANSPORTER = '' } = process.env;

// only starts network broker if transporter properly configured
if (TRANSPORTER.match(/^(?:nats|TCP)/)) {
	require('./broker');
}
