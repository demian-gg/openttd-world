import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createGlobalStyle } from "styled-components";
import App from "./App";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Perfect DOS VGA 437';
    src: url('/fonts/perfect-dos-vga-437.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  html {
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: grayscale;
    image-rendering: pixelated;
  }

  body {
    margin: 0;
    background-color: #264B77;

    color: #FFFFFF;
    font-family: "Perfect DOS VGA 437", system-ui;
    text-shadow: 0.2px 0px 0px #FFFFFF, -0.2px 0px 0px #FFFFFF;
  }
`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalStyle />
    <App />
  </StrictMode>
);
