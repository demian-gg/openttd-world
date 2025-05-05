import React, { useMemo } from "react";
import styled from "styled-components";

const PanelContainer = styled.div`
  display: flex;
  align-items: stretch;
  gap: 30px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.img`
  object-fit: contain;
  filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.4));
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  flex-grow: 1;
`;

const Text = styled.div`
  display: flex;
  align-items: center;

  font-size: 1.5em;
  height: 40%;

  filter: drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.4));
`;

interface LogoProps {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface TerrainInfoProps {
  logo: LogoProps | string;
  primaryText?: React.ReactNode;
  secondaryText?: React.ReactNode;
}

const TerrainInfo = (props: TerrainInfoProps) => {
  const { primaryText, secondaryText } = props;

  const logo = useMemo(() => {
    // Handle logo prop provided as a simple string path.
    if (typeof props.logo === "string") {
      return {
        src: props.logo,
        width: 65,
        height: 65,
        alt: "Logo",
      };
    }
    // Handle logo prop provided as an object.
    return {
      src: props.logo.src,
      width: props.logo.width ?? 65,
      height: props.logo.height ?? 65,
      alt: props.logo.alt ?? "Logo",
    };
  }, [props.logo]);

  return (
    <PanelContainer>
      <LogoContainer>
        <Logo
          src={logo.src}
          width={logo.width}
          height={logo.height}
          alt={logo.alt}
        />
      </LogoContainer>
      <TextContainer>
        <Text>{primaryText}</Text>
        <Text>{secondaryText}</Text>
      </TextContainer>
    </PanelContainer>
  );
};

export default TerrainInfo;
