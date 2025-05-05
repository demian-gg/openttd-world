import React, { CSSProperties } from "react";
import styled from "styled-components";

interface GroupContainerProps {
  direction: "row" | "column";
  gap: string;
}

const GroupContainer = styled.div<GroupContainerProps>`
  display: flex;
  align-items: center;
  justify-content: flex-start;

  flex-direction: ${(props) => props.direction};
  gap: ${(props) => props.gap};
`;

interface GroupProps extends GroupContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

const Group = (props: GroupProps) => {
  const { children, className, direction, gap, style } = props;

  return (
    <GroupContainer
      className={className}
      direction={direction}
      gap={gap}
      style={style}
    >
      {children}
    </GroupContainer>
  );
};

export default Group;
