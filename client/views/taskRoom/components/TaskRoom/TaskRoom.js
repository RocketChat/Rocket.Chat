import { Flex, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import toastr from 'toastr';

import { useSetModal } from '../../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import TaskDetailsModal from '../../taskDetailsModal';
import CreateTaskModal from '../CreateTaskModal';
import Task from '../Task/Task';

export default function TaskRoom({ rid, tasks, userId }) {
	const [sortType, setSortType] = useState('');

	const followTask = useEndpointActionExperimental('POST', 'taskRoom.followTask');
	const unfollowTask = useEndpointActionExperimental('POST', 'taskRoom.unfollowTask');

	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const setFollowing = useCallback(
		async (following, mid) => {
			try {
				if (following) {
					await unfollowTask({ mid });
					toastr.success(TAPi18n.__('You_unfollowed_this_task'));
					return;
				}

				await followTask({ mid });
				toastr.success(TAPi18n.__('You_followed_this_task'));
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
	}, [tasks.id, tasks.length]);

	const sortTasks = () => {
		const sortByDate = () => {
			if (sortType === 'date') {
				tasks.sort((a, b) => a.ts < b.ts);
				setSortType('');
			} else {
				tasks.sort((a, b) => a.ts > b.ts);
				setSortType('date');
			}
		};

		const sortByStatus = () => {
			if (sortType === 'status') {
				tasks.sort((a, b) => a.taskStatus < b.taskStatus);
				setSortType('');
			} else {
				tasks.sort((a, b) => a.taskStatus > b.taskStatus);
				setSortType('status');
			}
		};

		const sortByUser = () => {
			if (sortType === 'user') {
				tasks.sort((a, b) => a.u.username < b.u.username);
				setSortType('');
			} else {
				tasks.sort((a, b) => a.u.username > b.u.username);
				setSortType('user');
			}
		};

		return {
			sortByDate,
			sortByStatus,
			sortByUser,
		};
	};

	const { sortByDate, sortByStatus, sortByUser } = sortTasks();

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
				<Button ghost info onClick={sortByUser}>
					{'Sort by Creator'}
				</Button>
				<Button ghost info onClick={sortByDate}>
					{'Sort by Date'}
				</Button>
				<Button ghost info onClick={sortByStatus}>
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
