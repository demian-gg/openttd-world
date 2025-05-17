import React, { CSSProperties } from "react";
import styled from "styled-components";

interface GroupContainerProps {
  direction: "row" | "column";
  gap: string;
}

const GroupContainer = styled.div<GroupContainerProps>`
  display: flex;
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
      style={style}
      className={className}
      direction={direction}
      gap={gap}
    >
      {children}
    </GroupContainer>
  );
};

export default Group;
