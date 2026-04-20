import { memo } from 'react'
import { formatReadableDate } from '../utils/date'
import { getEmotionalCaption } from '../utils/emotional'
import SmartImage from './SmartImage'

function MemoryTimelineItem({ entry, onEdit, onDelete, deleting }) {
  return (
    <article className="relative pl-6">
      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-violet-300 shadow-[0_0_0_4px_rgba(221,214,254,0.6)]" />
      <div className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/80 via-white to-rose-50/80 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-500">
            {formatReadableDate(entry.date)}
          </p>
          {entry.mood && <p className="text-xl">{entry.mood}</p>}
        </div>
        {entry.sourceTag && (
          <p className="mt-1 inline-flex rounded-full border border-violet-200 bg-violet-50/80 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
            {entry.sourceTag}
          </p>
        )}
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{entry.text || '-'}</p>
        <p className="mt-1 text-xs italic text-violet-600">{getEmotionalCaption(entry)}</p>
        {entry.imageUrl && (
          <SmartImage
            src={entry.imageUrl}
            alt={`Memory ${entry.date}`}
            containerClassName="mt-2 rounded-xl"
            className="h-36 w-full rounded-xl object-cover"
          />
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(entry)}
            className="pressable rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(entry)}
            disabled={deleting}
            className="pressable rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default memo(MemoryTimelineItem)
