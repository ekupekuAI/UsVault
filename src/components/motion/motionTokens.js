export const cardEnter = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export const overlayEnter = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalEnter = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.98 },
}

export const softSpring = { type: 'spring', stiffness: 250, damping: 22, mass: 0.7 }
export const quickSpring = { type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }

export const hoverLift = { scale: 1.03, y: -2 }
export const tapPress = { scale: 0.95 }
