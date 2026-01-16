import GenericCard from './GenericCard';
import type { GenericCardSlots } from './GenericCard';

type StreamCardProps = {
	children: React.ReactNode;
	vertical?: boolean;
	title: string;
	slots?: GenericCardSlots;
};

const getProps = (vertical: boolean) => {
	if (vertical) {
		return {
			width: '100%',
			height: 'fit-content',
		};
	}

	return {
		width: 'fit-content',
		height: '100%',
	};
};

const StreamCard = ({ children, vertical = false, title, slots }: StreamCardProps) => {
	return (
		<GenericCard title={title} {...getProps(vertical)} slots={slots}>
			{children}
		</GenericCard>
	);
};

export default StreamCard;
