import styled from 'styled-components';

interface IconProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
}

const Icon = styled.img<IconProps>`
  display: block;
  
  width: ${({ width = '24px' }) => typeof width === 'number' ? `${width}px` : width};
  height: ${({ height = '24px' }) => typeof height === 'number' ? `${height}px` : height};
`;

export default Icon;
