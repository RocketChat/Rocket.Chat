import { Flex, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import React, { useEffect, useState, useRef, useCallback } from 'react';

import { useSetModal } from '../../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import TaskDetailsModal from '../../taskDetailsModal';
import CreateTaskModal from '../CreateTaskModal';
import Task from '../Task/Task';

export default function TaskRoom({ rid, tasks, userId }) {
	const [sort, setSort] = useState(['', 'asc']);

	const followTask = useEndpointActionExperimental('POST', 'taskRoom.followTask');
	const unfollowTask = useEndpointActionExperimental('POST', 'taskRoom.unfollowTask');

	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const setFollowing = useCallback(
		async (following, mid) => {
			console.log(following);
			try {
				if (following) {
					await unfollowTask({ mid });
					return;
				}

				await followTask({ mid });
			} catch (error) {
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
			}
		},
		[dispatchToastMessage, unfollowTask, followTask],
	);

	const handleCreate = () => {
		setModal(
			<CreateTaskModal
				rid={rid}
				onCreate={() => setModal()}
				onClose={() => setModal()}
			></CreateTaskModal>,
		);
	};

	const tasksWrapper = useRef(null);

	useEffect(() => {
		tasksWrapper.current.scrollTo(30, tasksWrapper.current.scrollHeight);
	});

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
		// setTasks(sortedTasks);
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

	const handleLoadMore = (e) => {
		const top = e.target.scrollTop === 0;
		if (!top) {
			return;
		}
		console.log('loadmoreTaskRoom');
	};

	return (
		<div className='wrapper'>
			<ButtonGroup align='center'>
				<Button ghost info onClick={() => sortTasks('Creator')}>
					{'Sort by Creator'}
				</Button>
				<Button ghost info onClick={() => sortTasks('Date')}>
					{'Sort by Date'}
				</Button>
				<Button ghost info onClick={() => sortTasks('Status')}>
					{'Sort by Status'}
				</Button>
				<Button primary onClick={handleCreate}>
					{'Create a task'}
				</Button>
			</ButtonGroup>
			<Box
				className='tasks__wrapper'
				onScroll={handleLoadMore}
				style={{ overflowY: 'auto', height: '87.5vh' }}
				ref={tasksWrapper}
			>
				<Flex.Container className='taskRoom_tasksContainer' style={{ overflowY: 'auto' }}>
					{tasks !== undefined &&
						tasks[0] &&
						tasks.map((task) => (
							<Task
								handleTaskDetails={() => handleTaskDetails(task)}
								rid={rid}
								following={!!(task.replies && task.replies.includes(userId))}
								setFollowing={setFollowing}
								title={task.title}
								username={task.u && task.u.username}
								taskId={task._id}
								ts={task.ts}
								status={task.taskStatus}
								taskAssignee={task.taskAssignee}
								key={task._id}
								tcount={task.tcount}
							/>
						))}
				</Flex.Container>
			</Box>
		</div>
	);
}
