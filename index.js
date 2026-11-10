import { registerRootComponent } from "expo";
import App from "./App";
import React from "react";
import { SoundProvider } from "./src/render/sound";
const Root = () => (
  <SoundProvider>
    <App />
  </SoundProvider>
);
registerRootComponent(Root);
