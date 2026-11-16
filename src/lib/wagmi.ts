import { createConfig, http, type CreateConnectorFn } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { arcTestnet } from "./arc";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

const connectors: CreateConnectorFn[] = [injected()];
if (projectId && typeof window !== "undefined") {
  connectors.push(
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: "GigersApp",
        description: "One Marketplace. Every Skill. Secure Payments.",
        url: window.location.origin,
        icons: [],
      },
    })
  );
}

export const config = createConfig({
  chains: [arcTestnet],
  connectors,
  transports: { [arcTestnet.id]: http() },
  ssr: true,
});
