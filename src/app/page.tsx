import { LandingPage } from "@/components/LandingPage";
import { getClientesImageFilesForCarousel } from "@/lib/clientes-assets";

export default function Home() {
  const clientesImageFiles = getClientesImageFilesForCarousel();
  return <LandingPage clientesImageFiles={clientesImageFiles} />;
}
