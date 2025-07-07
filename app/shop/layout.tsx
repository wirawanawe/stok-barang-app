"use client";

import { CustomerAuthProvider } from "@/lib/customer-auth-context";
import { FeatureProvider } from "@/lib/feature-context";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureProvider>
      <CustomerAuthProvider>{children}</CustomerAuthProvider>
    </FeatureProvider>
  );
}
