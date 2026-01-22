import GenericCard from './GenericCard';
import type { GenericCardSlots } from './GenericCard';

type StreamCardProps = {
	children: React.ReactNode;
	vertical?: boolean;
	title: string;
	slots?: GenericCardSlots;
};

const StreamCard = ({ children, title, slots }: StreamCardProps) => {
	return (
		<GenericCard title={title} slots={slots}>
			{children}
		</GenericCard>
	);
};

export default StreamCard;
