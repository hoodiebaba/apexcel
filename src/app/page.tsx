"use client";

import Navigation from "@/components/navigation";
import FeatureSection from "@/components/feature-section";
import SocialProof from "@/components/social-proof";
import PricingTable from "@/components/pricing-table";
import VideoSection from "@/components/video-section";
import CasesSection from "@/components/cases-section";
import ListSection from "@/components/list-section";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section (agar header ke andar ya alag file me hai to yaha add karna hoga) */}
      <header className="py-20 text-center bg-gray-50">
        <h1 className="text-5xl font-bold text-gray-900">
          Welcome to Our Platform 🚀
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          A modern SaaS landing page built with Next.js + Tailwind
        </p>
      </header>

      {/* Sections */}
      <main className="flex-1">
        <FeatureSection />
        <SocialProof />
        <PricingTable />
        <CasesSection />
        <ListSection />
        <VideoSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}