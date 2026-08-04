import SlaEdit from './SlaEdit';

export type SlaNewProps = {
	reload: () => void;
};

function SlaNew({ reload }: SlaNewProps) {
	return <SlaEdit isNew reload={reload} />;
}

export default SlaNew;
