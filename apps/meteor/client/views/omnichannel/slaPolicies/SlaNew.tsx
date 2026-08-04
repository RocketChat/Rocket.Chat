import SlaEdit from './SlaEdit';

function SlaNew({ reload }: { reload: () => void }) {
	return <SlaEdit isNew reload={reload} />;
}

export default SlaNew;
