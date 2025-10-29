import { motion } from "framer-motion";

export function CyberpunkBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-black" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)",
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255, 0, 128, 0.15) 0%, transparent 70%)",
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlMCCg0QFBcYvhLfAAAAPklEQVQ4y2NgAAOBBgYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBQYGBgAA//8DABFgAf0AAAAASUVORK5CYII=)",
        }}
      />

      {/* Scan lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)",
        }}
        animate={{
          y: [0, 8],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
