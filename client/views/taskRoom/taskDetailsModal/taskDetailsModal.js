import { t } from '../../../../app/utils/client';
import GenericModal from '../../../components/GenericModal';

const TaskDetailsModal = ({
	onUpdate,
	onCancel,
	taskTitle,
	taskDescription,
	taskAssignee,
	taskStatut,
	...props
}) => (
	<GenericModal
		variant='info'
		confirmText={t('Save')}
		onConfirm={onUpdate}
		onCancel={onCancel}
		onClose={onCancel}
	>
		{console.log(props)}
		<div>
			<h4>Task Title: </h4>
			<p>{taskTitle}</p>
		</div>
		<div>
			<h4>Task Description: </h4>
			<p>{taskDescription}</p>
		</div>
		<div>
			<h4>Task Assignee: </h4>
			<p>{taskAssignee}</p>
		</div>
		<div>
			<h4>Task Statut: </h4>
			<p>{taskStatut}</p>
		</div>
	</GenericModal>
);

export default TaskDetailsModal;
