"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

export function IntroAnimation() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(false), 1450);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="intro-shell" aria-hidden="true">
      <div className="intro-card">
        <BrandLogo />
        <div className="intro-score">
          <span>850</span>
          <div className="intro-trend">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="intro-bar">
          <span />
        </div>
      </div>
    </div>
  );
}
