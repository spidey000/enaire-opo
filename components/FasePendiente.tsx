'use client'

import { Clock } from 'lucide-react'

interface Props {
  title: string
  description: string
}

export function FasePendiente({ title, description }: Props) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-8 text-center space-y-3">
      <Clock className="h-10 w-10 text-amber-500 mx-auto" />
      <h3 className="text-lg font-semibold text-amber-900">{title}</h3>
      <p className="text-sm text-amber-800 max-w-md mx-auto">{description}</p>
    </div>
  )
}
