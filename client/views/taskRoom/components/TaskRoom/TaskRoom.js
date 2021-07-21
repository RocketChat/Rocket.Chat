import { Flex, ButtonGroup, Button } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import { useSetModal } from '../../../../contexts/ModalContext';
import TaskDetailsModal from '../../taskDetailsModal';
import CreateTaskModal from '../CreateTaskModal';
import Task from '../Task/Task';

export default function TaskRoom({ rid, tasks, setTasks }) {
	const [sort, setSort] = useState(['', 'asc']);

	const setModal = useSetModal();

	const handleCreate = () => {
		setModal(
			<CreateTaskModal
				rid={rid}
				onCreate={() => setModal()}
				onClose={() => setModal()}
			></CreateTaskModal>,
		);
	};

	const sortTasks = (id) => {
		const sortedTasks = [...tasks];
		(id === 'Date' && sort[0] === id && sortedTasks.sort((a, b) => a.ts > b.ts)) ||
			(sort[0] !== id && sortedTasks.sort((a, b) => a.ts < b.ts));
		(id === 'Creator' &&
			sort[0] === id &&
			sortedTasks.sort((a, b) => a.u.username > b.u.username)) ||
			(sort[0] !== id && sortedTasks.sort((a, b) => a.u.username < b.u.username));
		(id === 'Status' &&
			sort[0] === id &&
			sortedTasks.sort((a, b) => a.taskStatus > b.taskStatus)) ||
			(sort[0] !== id && sortedTasks.sort((a, b) => a.taskStatus < b.taskStatus));
		setSort([id, 'asc']);
		setTasks(sortedTasks);
	};

	const handleTaskDetails = (task) => {
		setModal(
			<TaskDetailsModal
				task={task}
				onCreate={() => setModal()}
				onClose={() => setModal()}
			></TaskDetailsModal>,
		);
	};

	return (
		<>
			<Flex.Container alignItems='center'>
				<ButtonGroup align='center'>
					<Button ghost info onClick={() => sortTasks('Creator')}>
						{'Sort by Creator'}
					</Button>
					<Button info onClick={() => sortTasks('Date')}>
						{'Sort by Date'}
					</Button>
					<Button small onClick={() => sortTasks('Status')}>
						{'Sort by Status'}
					</Button>
					<Button primary onClick={handleCreate}>
						{'Create a task'}
					</Button>
				</ButtonGroup>
			</Flex.Container>
			<Flex.Container>
				{tasks !== undefined &&
					tasks.length &&
					tasks.map((task) => (
						<Task
							handleTaskDetails={() => handleTaskDetails(task)}
							rid={rid}
							title={task.title}
							username={task.u.username}
							taskId={task._id}
							ts={task.ts}
							status={task.taskStatus}
							taskAssignee={task.taskAssignee}
							key={task._id}
							tcount={task.tcount}
						/>
					))}
			</Flex.Container>
		</>
	);
}
