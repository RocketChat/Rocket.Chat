import styled from '@rocket.chat/styled';

const filterElementProps = ({
  imageUrl: _imageUrl,
  size: _size,
  ...props
}: {
  imageUrl: string;
  size: number;
}) => props;

export const Element = styled('div', filterElementProps)`
  box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: cover;
  background-color: rgba(204, 204, 204, 38%);
  background-image: url(${(props) => props.imageUrl});
  width: ${(props) => String(props.size)}px;
  height: ${(props) => String(props.size)}px;
  border-radius: 4px;
  overflow: hidden;
  margin-inline-start: 4px;
`;
