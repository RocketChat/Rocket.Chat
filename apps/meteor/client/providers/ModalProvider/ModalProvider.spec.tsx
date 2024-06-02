// import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import React, { Suspense, createContext, useContext, useEffect } from 'react';

import GenericModal from '../../components/GenericModal';
import { imperativeModal } from '../../lib/imperativeModal';
import ModalRegion from '../../views/modal/ModalRegion';
import ModalProvider from './ModalProvider';
import ModalProviderWithRegion from './ModalProviderWithRegion';

type TestModalProps = { emitterEvent: string; modalFunc?: () => ReactNode; onClose?: () => void };

const TestContext = createContext({ title: 'default' });
const emitter = new Emitter();

const TestModal = ({ emitterEvent, modalFunc, onClose = () => undefined }: TestModalProps) => {
	const setModal = useSetModal();
	const { title } = useContext(TestContext);

	useEffect(() => {
		return emitter.on(emitterEvent, () => {
			setModal(modalFunc || <GenericModal title={title} onClose={onClose}></GenericModal>);
		});
	}, [emitterEvent, setModal, title, modalFunc, onClose]);

	return <></>;
};

describe('Modal Provider', () => {
	it('should render a modal', async () => {
		render(
			<Suspense fallback={null}>
				<ModalProviderWithRegion>
					<TestModal emitterEvent='open' />
				</ModalProviderWithRegion>
			</Suspense>,
		);
		emitter.emit('open');

		expect(await screen.findByText('default')).toBeTruthy();
	});

	it('should render a modal that is passed as a function', async () => {
		render(
			<Suspense fallback={null}>
				<ModalProviderWithRegion>
					<TestModal emitterEvent='open' modalFunc={() => <GenericModal title='function modal' onClose={() => undefined} />} />
				</ModalProviderWithRegion>
			</Suspense>,
		);
		emitter.emit('open');
		expect(await screen.findByText('function modal')).toBeTruthy();
	});

	it('should render a modal through imperative modal', async () => {
		render(
			<Suspense fallback={null}>
				<ModalProvider>
					<ModalRegion />
				</ModalProvider>
			</Suspense>,
		);

		const { close } = imperativeModal.open({
			component: GenericModal,
			props: { title: 'imperativeModal' },
		});

		expect(await screen.findByText('imperativeModal')).toBeTruthy();

		close();

		expect(screen.queryByText('imperativeModal')).toBeFalsy();
	});

	it('should not render a modal if no corresponding region exists', () => {
		// ModalProviderWithRegion will always have a region identifier set
		// and imperativeModal will only render modals in the default region (e.g no region identifier)
		render(
			<Suspense fallback={null}>
				<ModalProviderWithRegion />
			</Suspense>,
		);

		imperativeModal.open({
			component: GenericModal,
			props: { title: 'imperativeModal' },
		});

		expect(screen.queryByText('imperativeModal')).toBeFalsy();
	});

	it('should render a modal in another region', async () => {
		render(
			<TestContext.Provider value={{ title: 'modal1' }}>
				<ModalProviderWithRegion>
					<TestModal emitterEvent='openModal1' />
				</ModalProviderWithRegion>
				<TestContext.Provider value={{ title: 'modal2' }}>
					<ModalProviderWithRegion>
						<TestModal emitterEvent='openModal2' />
					</ModalProviderWithRegion>
				</TestContext.Provider>
			</TestContext.Provider>,
		);

		emitter.emit('openModal1');
		expect(await screen.findByText('modal1')).toBeTruthy();
		emitter.emit('openModal2');
		expect(await screen.findByText('modal2')).toBeTruthy();
	});

	it('should call onClose function when modal dismissed', () => {
		const mockCallback = jest.fn();

		render(
			<Suspense fallback={null}>
				<ModalProviderWithRegion>
					<TestModal emitterEvent='open' onClose={mockCallback} />
				</ModalProviderWithRegion>
			</Suspense>,
		);

		emitter.emit('open');

		expect(mockCallback.mock.calls).toHaveLength(0);

		userEvent.keyboard('{Escape}');

		expect(screen.queryByText('default')).toBeFalsy();
		expect(mockCallback.mock.calls).toHaveLength(1);
	});
});
