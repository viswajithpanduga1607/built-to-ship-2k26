import { cn } from '../../lib/utils'

/**
 * StatusBadge
 * Renders a color-coded pill badge for request statuses and AI decisions.
 *
 * @param {{ status: string, size?: 'sm'|'md', className?: string }} props
 */
export function StatusBadge({ status, size = 'md', className }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending']

  const sizeClass = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border',
        config.classes,
        sizeClass,
        className
      )}
    >
      {/* Animated pulse dot */}
      <span className={cn('relative flex h-1.5 w-1.5 rounded-full', config.dot)}>
        {status === 'Pending' && (
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.dot
          )} />
        )}
      </span>
      {config.label ?? status}
    </span>
  )
}

const STATUS_CONFIG = {
  'Pending': {
    label:   'Pending',
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    dot:     'bg-amber-400',
  },
  'Approved': {
    label:   'Approved',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    dot:     'bg-emerald-400',
  },
  'Rejected': {
    label:   'Rejected',
    classes: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    dot:     'bg-rose-400',
  },
  'Requires Manual Review': {
    label:   'In Review',
    classes: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    dot:     'bg-violet-400',
  },
}
