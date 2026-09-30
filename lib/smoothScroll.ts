// lib/smoothScroll.ts

/**
 * Easing function: easeInOutCubic
 * Produces a gradual acceleration, silky high-speed glide, and smooth cushioned deceleration.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface ScrollOptions {
  duration?: number;
  offset?: number;
  highlight?: boolean;
  onComplete?: () => void;
}

let activeAnimationId: number | null = null;
let cleanupInterrupts: (() => void) | null = null;

/**
 * Animated smooth scroll with custom physics/cubic easing.
 * Eliminates browser-dependent jitter, snap jumps, and respects navbar clearance.
 */
export function animatedScrollTo(targetY: number, options?: ScrollOptions) {
  if (typeof window === 'undefined') return;

  // Cancel any running programmatic scroll
  if (activeAnimationId !== null) {
    cancelAnimationFrame(activeAnimationId);
    activeAnimationId = null;
  }
  if (cleanupInterrupts) {
    cleanupInterrupts();
    cleanupInterrupts = null;
  }

  const startY = window.pageYOffset;
  const offset = options?.offset ?? 0;
  const destination = Math.max(0, targetY - offset);
  const distance = destination - startY;

  // If already at destination
  if (Math.abs(distance) < 4) {
    options?.onComplete?.();
    return;
  }

  // Dynamic duration between 650ms (short jump) and 950ms (long page glide)
  const duration = options?.duration ?? Math.min(950, Math.max(650, Math.abs(distance) * 0.35));

  // Temporarily disable CSS scroll-behavior to avoid conflict with requestAnimationFrame
  const originalScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';

  let startTime: number | null = null;
  let isCancelled = false;

  const onInterrupt = () => {
    isCancelled = true;
    if (activeAnimationId !== null) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }
    document.documentElement.style.scrollBehavior = originalScrollBehavior;
    if (cleanupInterrupts) {
      cleanupInterrupts();
      cleanupInterrupts = null;
    }
  };

  const events = ['wheel', 'touchmove'];
  events.forEach((evt) => window.addEventListener(evt, onInterrupt, { passive: true }));

  cleanupInterrupts = () => {
    events.forEach((evt) => window.removeEventListener(evt, onInterrupt));
  };

  const step = (currentTime: number) => {
    if (isCancelled) return;

    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * ease);

    if (progress < 1) {
      activeAnimationId = requestAnimationFrame(step);
    } else {
      activeAnimationId = null;
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      if (cleanupInterrupts) {
        cleanupInterrupts();
        cleanupInterrupts = null;
      }
      options?.onComplete?.();
    }
  };

  activeAnimationId = requestAnimationFrame(step);
}

/**
 * Scroll directly to a DOM element by id with offset & arrival visual highlight
 */
export function scrollToElement(elementId: string, options?: ScrollOptions) {
  if (typeof window === 'undefined') return;

  if (elementId === 'top' || !elementId) {
    animatedScrollTo(0, {
      duration: options?.duration ?? 700,
      offset: 0,
      onComplete: options?.onComplete,
    });
    return;
  }

  const element = document.getElementById(elementId);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const targetY = rect.top + window.pageYOffset;
  // Offset clearance: navbar height + breathing margin
  const navOffset = options?.offset ?? (window.scrollY > 20 ? 82 : 92);

  animatedScrollTo(targetY, {
    duration: options?.duration,
    offset: navOffset,
    onComplete: () => {
      if (options?.highlight !== false) {
        // Trigger subtle arrival glow highlight
        element.classList.remove('section-arrival-glow');
        void element.offsetWidth; // force DOM reflow
        element.classList.add('section-arrival-glow');
        setTimeout(() => {
          element.classList.remove('section-arrival-glow');
        }, 1600);
      }
      options?.onComplete?.();
    },
  });
}
