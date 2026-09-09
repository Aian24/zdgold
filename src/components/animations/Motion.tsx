'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Smooth subtle fade up on scroll into view
export const FadeInUp: React.FC<
  HTMLMotionProps<'div'> & { delay?: number; duration?: number; distance?: number }
> = ({ children, className = '', delay = 0, duration = 0.5, distance = 24, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Smooth fade in without movement
export const FadeIn: React.FC<
  HTMLMotionProps<'div'> & { delay?: number; duration?: number }
> = ({ children, className = '', delay = 0, duration = 0.4, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stagger Container for Grids and Lists
export const StaggerContainer: React.FC<
  HTMLMotionProps<'div'> & { staggerDelay?: number; delayChildren?: number }
> = ({ children, className = '', staggerDelay = 0.08, delayChildren = 0.05, ...props }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Item inside Stagger Container
export const StaggerItem: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Subtle Card Scale & Hover Lift
export const MotionCard: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Badge Pop Animation
export const PopBadge: React.FC<
  HTMLMotionProps<'div'> & { triggerKey?: any }
> = ({ children, className = '', triggerKey, ...props }) => {
  return (
    <motion.div
      key={triggerKey}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
