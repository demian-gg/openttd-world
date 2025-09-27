import styled from "styled-components";
import Overlay from "./components/Overlay";
import TerrainInfo from "./components/TerrainInfo";
import Button from "./components/ui/Button";
import Group from "./components/ui/Group";
import Icon from "./components/ui/Icon";
import Modal from "./components/ui/Modal";

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 800;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 900;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function App() {
  return (
    <>
      <Overlay
        topLeft={
          <Group gap="30px" direction="row">
            <Icon
              src="/images/logo.png"
              height={60}
              width={60}
              rendering="auto"
              alt="Logo"
            />
            <TerrainInfo
              primaryInfo="The Netherlands"
              secondaryInfo="512x512"
            />
          </Group>
        }
        topRight={
          <Group gap="10px" direction="row">
            <Button>
              <Icon src="/images/magnifying-glass.png" alt="Search" />
            </Button>
            <Button>
              <Icon src="/images/floppy-disk.png" alt="Export" />
            </Button>
          </Group>
        }
        bottomLeft={null}
        bottomRight={null}
        styles={{
          topLeft: {
            marginTop: "-5px",
          },
        }}
      />
      <ModalBackdrop />
      <ModalContainer>
        <Modal width={420} height={220}>
          <h2>Work in progress</h2>
          <p>
            The site isn&apos;t ready for use yet, but we&apos;re working on it
            and it&apos;ll be available soon.
          </p>
        </Modal>
      </ModalContainer>
    </>
  );
}

export default App;
