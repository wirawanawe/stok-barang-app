"use client";

import { CustomerAuthProvider } from "@/lib/customer-auth-context";
import { FeatureProvider } from "@/lib/feature-context";

export default function OrderConfirmationLayout({
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
