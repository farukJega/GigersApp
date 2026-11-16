import { createPublicClient, http } from "viem";
import { arcTestnet } from "./arc";

export const serverClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});
