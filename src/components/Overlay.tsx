import React from "react";
import styled from "styled-components";

const OverlayContainer = styled.div`
  /* Position absolutely to cover the entire viewport */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  /* Create a 3x3 grid layout for positioning corner elements */
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "top-left . top-right" ". . ." "bottom-left . bottom-right";

  padding: 36px;

  /* Prevent overlay from capturing pointer events except for its children */
  pointer-events: none;
  > * {
    pointer-events: auto;
  }

  /* Make all direct children drop a hard shadow */
  > * {
    filter: drop-shadow(0px 2px 0px rgba(0, 0, 0, 0.4));
  }
`;

const TopLeft = styled.div`
  grid-area: top-left;
`;

const TopRight = styled.div`
  grid-area: top-right;
`;

const BottomLeft = styled.div`
  grid-area: bottom-left;
`;

const BottomRight = styled.div`
  grid-area: bottom-right;
`;

interface OverlayProps {
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
  styles?: {
    topLeft?: React.CSSProperties;
    topRight?: React.CSSProperties;
    bottomLeft?: React.CSSProperties;
    bottomRight?: React.CSSProperties;
  };
}

const Overlay = (props: OverlayProps) => {
  const { topLeft, topRight, bottomLeft, bottomRight, styles } = props;

  return (
    <OverlayContainer>
      <TopLeft style={styles?.topLeft}>{topLeft}</TopLeft>
      <TopRight style={styles?.topRight}>{topRight}</TopRight>
      <BottomLeft style={styles?.bottomLeft}>{bottomLeft}</BottomLeft>
      <BottomRight style={styles?.bottomRight}>{bottomRight}</BottomRight>
    </OverlayContainer>
  );
};

export default Overlay;
