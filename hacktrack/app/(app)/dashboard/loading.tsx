import { BrandLoader } from "@/components/BrandLoader";

export default function Loading() {
  // Full screen, like the sign-in loader: nothing else (navbar included) shows while loading
  return <BrandLoader overlay title="Loading your dashboard" />;
}
