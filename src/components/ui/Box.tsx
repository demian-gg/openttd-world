import styled from 'styled-components';

interface BoxProps {
  style?: React.CSSProperties;
  className?: string;
}

const Box = styled.div<BoxProps>`
  background-color: #98845C;
  border-top: 2px solid #D4BC94;
  border-left: 2px solid #D4BC94;
  border-bottom: 2px solid #68502C;
  border-right: 2px solid #68502C;
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.4);
  padding: 10px;
`;

export default Box;
