import { Server } from "./src/server";
import config from "./src/config/default";

const server = new Server(config);

(async () => {
  await server.run();
})().catch(console.error);
