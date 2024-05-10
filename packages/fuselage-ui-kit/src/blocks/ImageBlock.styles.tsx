import styled from '@rocket.chat/styled';

const filterImageProps = ({
  imageUrl: _imageUrl,
  width: _width,
  height: _height,
  ...props
}: {
  imageUrl: string;
  width: number;
  height: number;
}) => props;

export const Image = styled('div', filterImageProps)`
  box-shadow: 0 0 0px 1px rgba(204, 204, 204, 38%);
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: cover;
  background-color: rgba(204, 204, 204, 38%);
  background-image: url(${(props) => props.imageUrl});
  width: ${(props) => String(props.width)}px;
  height: ${(props) => String(props.height)}px;
  overflow: hidden;
`;
