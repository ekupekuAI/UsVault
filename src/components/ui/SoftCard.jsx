import { motion } from 'framer-motion'
import { cardEnter, hoverLift, softSpring } from '../motion/motionTokens'

function SoftCard({ title, subtitle, className = '', children }) {
  const MotionArticle = motion.article

  return (
    <MotionArticle
      initial="hidden"
      animate="visible"
      variants={cardEnter}
      transition={{ ...softSpring, duration: 0.42 }}
      whileHover={hoverLift}
      className={`card-soft rounded-[26px] p-3.5 sm:p-4 ${className}`}
    >
      {title && (
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400">{title}</p>
          {subtitle && <p className="mt-1 text-[13px] font-medium text-slate-500">{subtitle}</p>}
        </header>
      )}
      <div className={title ? 'mt-3' : ''}>{children}</div>
    </MotionArticle>
  )
}

export default SoftCard
