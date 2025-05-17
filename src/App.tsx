import Overlay from "./components/Overlay";
import TerrainInfo from "./components/TerrainInfo";
import Button from "./components/ui/Button";
import Group from "./components/ui/Group";
import Icon from "./components/ui/Icon";

function App() {
  return (
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
          <TerrainInfo primaryInfo="The Netherlands" secondaryInfo="512x512" />
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
  );
}

export default App;
