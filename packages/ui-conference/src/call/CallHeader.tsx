import CallTitle from './CallTitle.js';
import { useCallState } from './context.js';

export type CallHeaderProps = {
	name?: string;
};

/** How long the call running in this window has been going, and what it is called. */
const CallHeader = ({ name }: CallHeaderProps) => {
	const { startedAt } = useCallState();

	return <CallTitle startAt={startedAt} name={name} />;
};

export default CallHeader;
