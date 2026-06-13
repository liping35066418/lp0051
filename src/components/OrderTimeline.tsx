import { Check } from 'lucide-react'

const steps = [
  { key: 'pending_confirm', label: '待确认' },
  { key: 'shooting', label: '拍摄中' },
  { key: 'delivered', label: '成片交付' },
  { key: 'completed', label: '已完成' },
]

export default function OrderTimeline({ status }: { status: string }) {
  const cancelled = status === 'cancelled'
  const stepOrder = ['pending_confirm', 'shooting', 'delivered', 'completed']
  const currentIndex = stepOrder.indexOf(status)

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const completed = !cancelled && index <= currentIndex
        const active = !cancelled && step.key === status

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                  completed
                    ? 'bg-brand-gold border-brand-gold text-brand-dark'
                    : 'border-brand-gray/30 text-brand-gray'
                } ${active ? 'ring-2 ring-brand-gold/30' : ''}`}
              >
                {completed ? <Check size={14} /> : index + 1}
              </div>
              <span
                className={`mt-2 text-xs whitespace-nowrap ${
                  completed ? 'text-brand-gold' : 'text-brand-gray'
                }`}
              >
                {step.label}
              </span>
              {cancelled && step.key === 'pending_confirm' && (
                <span className="text-xs text-red-400 mt-0.5">已取消</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] ${
                  !cancelled && index < currentIndex ? 'bg-brand-gold' : 'bg-brand-gray/20'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
