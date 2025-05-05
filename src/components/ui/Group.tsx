import React, { CSSProperties } from "react";
import styled from "styled-components";

const GroupContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
`;

interface GroupProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

const Group = (props: GroupProps) => {
  const { children, className, style } = props;

  return (
    <GroupContainer className={className} style={style}>
      {children}
    </GroupContainer>
  );
};

export default Group;
