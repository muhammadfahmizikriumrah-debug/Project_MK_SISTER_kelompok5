import { Brain } from 'lucide-react'

export default function BrainSketchLogo({
  size = 28,
  strokeWidth = 1.8,
  className = '',
  colorClass = 'text-primary-600 dark:text-gh-accent'
}) {
  return (
    <Brain
      size={size}
      strokeWidth={strokeWidth}
      className={`${colorClass} ${className}`.trim()}
    />
  )
}
