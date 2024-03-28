// import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import type { ReactNode } from 'react';
import React, { Suspense, createContext, useContext, useEffect } from 'react';

import GenericModal from '../../components/GenericModal';
import { imperativeModal } from '../../lib/imperativeModal';
import ModalRegion from '../../views/modal/ModalRegion';
import ModalProvider from './ModalProvider';
import ModalProviderWithRegion from './ModalProviderWithRegion';

const TestContext = createContext({ title: 'default' });
const emitter = new Emitter();

const TestModal = ({ emitterEvent, modalFunc }: { emitterEvent: string; modalFunc?: () => ReactNode }) => {
	const setModal = useSetModal();
	const { title } = useContext(TestContext);

	useEffect(() => {
		emitter.on(emitterEvent, () => {
			setModal(modalFunc || <GenericModal title={title} onClose={() => undefined}></GenericModal>);
		});
	}, [emitterEvent, setModal, title, modalFunc]);

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
		expect(await screen.findByText('default')).to.exist;
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
		expect(await screen.findByText('function modal')).to.exist;
	});

	it('should render a modal through imperative modal', () => {
		async () => {
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

			expect(await screen.findByText('imperativeModal')).to.exist;

			close();

			expect(screen.queryByText('imperativeModal')).to.not.exist;
		};
	});

	it('should not render a modal if no corresponding region exists', async () => {
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

		expect(screen.queryByText('imperativeModal')).to.not.exist;
	});

	it('should render a modal in another region', () => {
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
		expect(screen.getByText('modal1')).to.exist;
		emitter.emit('openModal2');
		expect(screen.getByText('modal2')).to.exist;
	});
});
