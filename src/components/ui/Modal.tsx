import React, { CSSProperties } from "react";
import styled from "styled-components";

interface ModalFrameProps {
  $width: number;
  $height: number;
}

const ModalFrame = styled.div<ModalFrameProps>`
  background-color: #98845c;
  border-top: 2px solid #d4bc94;
  border-left: 2px solid #d4bc94;
  border-bottom: 2px solid #68502c;
  border-right: 2px solid #68502c;
  color: #ffffff;
  text-shadow: 2px 2px 0px #000000;
  width: min(calc(100vw - 48px), ${({ $width }) => `${$width}px`});
  height: min(calc(100vh - 48px), ${({ $height }) => `${$height}px`});
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  text-align: center;
`;

interface ModalProps {
  children?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const Modal = ({
  children,
  width = 360,
  height = 220,
  className,
  style,
}: ModalProps) => {
  return (
    <ModalFrame
      $width={width}
      $height={height}
      className={className}
      style={style}
    >
      {children}
    </ModalFrame>
  );
};

export default Modal;
