'use client';

import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { BrandLogos } from './BrandLogos';
import { Demo } from './Demo';
import { About } from './About';
import { Features } from './Features';
import { Testimonials } from './Testimonials';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { Contact } from './Contact';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="bg-[#0a0a0f] text-white selection:bg-purple-500/30">
      <Navbar />
      <main>
        <Hero />
        <BrandLogos />
        <Demo />
        <About />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
