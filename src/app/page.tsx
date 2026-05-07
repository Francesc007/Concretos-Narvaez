import { LandingPage } from "@/components/LandingPage";
import { getClientesImageFiles, shuffleArray } from "@/lib/clientes-assets";

export default function Home() {
  const clientesImageFiles = shuffleArray(getClientesImageFiles());
  return <LandingPage clientesImageFiles={clientesImageFiles} />;
}
