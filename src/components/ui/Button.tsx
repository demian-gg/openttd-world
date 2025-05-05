import styled from 'styled-components';
import Box from './Box';

const Button = styled(Box).attrs({ as: 'button' })`
  cursor: pointer;
  user-select: none;

  /* Visual feedback on click */
  &:active {
    background-color: #80704C;
    border-top-color: #68502C;
    border-left-color: #68502C;
    border-bottom-color: #D4BC94;
    border-right-color: #D4BC94;
    box-shadow: none;
  }

  /* Disabled state */
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export default Button;
