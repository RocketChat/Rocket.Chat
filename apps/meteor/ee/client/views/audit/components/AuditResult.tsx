import type { ILivechatAgent, ILivechatVisitor, IRoom, IUser } from '@rocket.chat/core-typings';
import { Blaze } from 'meteor/blaze';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import type { ReactElement } from 'react';
import React, { useEffect, useRef, memo } from 'react';

import type { IAuditLog } from '../../../../definition/IAuditLog';
import type { DateRange } from '../utils/dateRange';

type AuditResultProps = {
	className?: string;
	type: IAuditLog['fields']['type'];
	msg: string;
	dateRange: DateRange;
	rid: IRoom['_id'];
	users: Exclude<IUser['username'], undefined>[];
	visitor: ILivechatVisitor['_id'];
	agent: ILivechatAgent['_id'];
};

const AuditResult = ({ className, type, msg, dateRange, rid, users, visitor, agent }: AuditResultProps): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);

	const reactiveDataRef = useRef(
		new ReactiveDict(undefined, {
			rid,
			msg,
			dateRange,
			users,
			visitor,
			agent,
		}),
	);

	useEffect(() => {
		reactiveDataRef.current.set('msg', msg);
	}, [msg]);

	useEffect(() => {
		reactiveDataRef.current.set('dateRange', dateRange);
	}, [dateRange]);

	useEffect(() => {
		reactiveDataRef.current.set('rid', rid);
	}, [rid]);

	useEffect(() => {
		reactiveDataRef.current.set('users', users);
	}, [users]);

	useEffect(() => {
		reactiveDataRef.current.set('visitor', visitor);
	}, [visitor]);

	useEffect(() => {
		reactiveDataRef.current.set('agent', agent);
	}, [agent]);

	useEffect(() => {
		let view: Blaze.View | undefined;

		// @ts-expect-error An import path cannot end with a '.ts' extension.
		import('../../../templates/audit/audit.ts').then(() => {
			if (!ref.current) {
				return;
			}

			view = Blaze.renderWithData(
				Template.audit,
				() => ({
					type,
					msg: reactiveDataRef.current.get('msg'),
					startDate: reactiveDataRef.current.get('dateRange')?.start ?? new Date(0),
					endDate: reactiveDataRef.current.get('dateRange')?.end ?? new Date(),
					rid: reactiveDataRef.current.get('rid'),
					users: reactiveDataRef.current.get('users'),
					visitor: reactiveDataRef.current.get('visitor'),
					agent: reactiveDataRef.current.get('agent'),
				}),
				ref.current,
			);
		});

		return () => {
			if (view) Blaze.remove(view);
		};
	}, [type]);

	return <div className={className} ref={ref} />;
};

export default memo(AuditResult);
