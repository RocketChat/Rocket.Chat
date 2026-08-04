export type ConnectionLineProps = {
	fromX: number;
	fromY: number;
	fromPosition: string;
	toX: number;
	toY: number;
	toPosition: string;
	connectionLineType: string;
};

const ConnectionLine = ({ fromX, fromY, toX, toY }: ConnectionLineProps) => (
	<g>
		<path
			fill='none'
			stroke='#222'
			strokeWidth={1.5}
			className='animated'
			d={`M${fromX},${fromY} C ${fromX} ${toY} ${fromX} ${toY} ${toX},${toY}`}
		/>
		<circle cx={toX} cy={toY} fill='#fff' r={2} stroke='#222' strokeWidth={1.5} />
	</g>
);

export default ConnectionLine;
