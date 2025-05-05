import React from "react";
import styled from "styled-components";

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Info = styled.div`
  font-size: 1.5em;
`;

interface TerrainInfoProps {
  primaryInfo?: React.ReactNode;
  secondaryInfo?: React.ReactNode;
}

const TerrainInfo = (props: TerrainInfoProps) => {
  const { primaryInfo, secondaryInfo } = props;

  return (
    <InfoContainer>
      <Info>{primaryInfo}</Info>
      <Info>{secondaryInfo}</Info>
    </InfoContainer>
  );
};

export default TerrainInfo;
