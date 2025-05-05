import Overlay from "./components/Overlay";
import Button from "./components/ui/Button";
import ButtonGroup from "./components/ui/ButtonGroup";
import TerrainInfo from "./components/TerrainInfo";
import Icon from "./components/ui/Icon";

function App() {
  return (
    <Overlay
      topLeft={
        <TerrainInfo
          logo="/images/logo.png"
          primaryText="The Netherlands"
          secondaryText="512x512"
        />
      }
      topRight={
        <ButtonGroup>
          <Button>
            <Icon src="/images/magnifying-glass.png" alt="Search" />
          </Button>
          <Button>
            <Icon src="/images/floppy-disk.png" alt="Export" />
          </Button>
        </ButtonGroup>
      }
      bottomLeft={null}
      bottomRight={null}
      styles={{
        topLeft: {
          marginTop: "-10px",
        },
      }}
    />
  );
}

export default App;
