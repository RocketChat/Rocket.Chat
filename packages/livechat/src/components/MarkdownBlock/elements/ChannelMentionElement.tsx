export type ChannelMentionElementProps = {
	mention: string;
};

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps) => {
	return <>#{mention}</>;
};

export default ChannelMentionElement;
