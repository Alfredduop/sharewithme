import { motion } from "motion/react";
import { useEffect, useState, useMemo } from "react";

export const FloatingParticles = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reduce particles significantly on mobile for better performance
  const particleCount = isMobile ? 8 : 20;
  const particles = useMemo(() => Array.from({ length: particleCount }, (_, i) => i), [particleCount]);
  
  // Disable particles entirely on low-end mobile devices
  if (isMobile && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-400/10 via-cyan-400/15 via-yellow-400/15 to-pink-400/15 rounded-full"
          initial={{
            x: Math.random() * (window.innerWidth || 1200),
            y: Math.random() * (window.innerHeight || 800),
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -50 - 50],
            opacity: [0, Math.random() * 0.4, 0],
          }}
          transition={{
            duration: isMobile ? Math.random() * 4 + 3 : Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};