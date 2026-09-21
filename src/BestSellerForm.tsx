import { useState, type FormEvent } from 'react'
import { ImageOff, LoaderCircle, X } from 'lucide-react'
import type { BestSeller, BestSellerPayload } from './types'

type Props = {
  item: BestSeller | null
  pending: boolean
  error: string
  onClose: () => void
  onSubmit: (payload: BestSellerPayload) => void
}

const emptyForm: BestSellerPayload = {
  title: '', coverUrl: '', coverAlt: '', price: 0, discountedPrice: 0,
  discountPercent: 0, remainingPercent: 100, sortOrder: 0, active: true,
}

export function BestSellerForm({ item, pending, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<BestSellerPayload>(() => item ? {
    title: item.title, coverUrl: item.coverUrl, coverAlt: item.coverAlt,
    price: item.price, discountedPrice: item.discountedPrice,
    discountPercent: item.discountPercent, remainingPercent: item.remainingPercent,
    sortOrder: item.sortOrder, active: item.active,
  } : emptyForm)
  const [localError, setLocalError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  const change = <K extends keyof BestSellerPayload>(key: K, value: BestSellerPayload[K]) => setForm((current) => ({ ...current, [key]: value }))

  function submit(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    if (!form.title.trim() || !form.coverUrl.trim()) return setLocalError('عنوان و آدرس تصویر جلد الزامی هستند.')
    if (form.price < 1 || form.discountedPrice < 0 || form.discountedPrice > form.price) return setLocalError('قیمت‌ها معتبر نیستند؛ قیمت فروش نباید بیشتر از قیمت اصلی باشد.')
    if ([form.discountPercent, form.remainingPercent].some((value) => value < 0 || value > 100)) return setLocalError('درصدها باید بین صفر تا صد باشند.')
    onSubmit({ ...form, title: form.title.trim(), coverUrl: form.coverUrl.trim(), coverAlt: form.coverAlt?.trim() || null })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <header className="drawer__header">
          <div><span className="eyebrow eyebrow--dark">مدیریت ویترین</span><h2 id="form-title">{item ? 'ویرایش کتاب پرفروش' : 'افزودن کتاب پرفروش'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="بستن"><X /></button>
        </header>
        <form onSubmit={submit} className="drawer__body">
          <div className="cover-preview">
            {form.coverUrl && !imageFailed ? <img src={form.coverUrl} alt="پیش‌نمایش جلد" onError={() => setImageFailed(true)} /> : <div><ImageOff /><span>پیش‌نمایش جلد</span></div>}
          </div>
          <div className="field field--full"><label htmlFor="title">عنوان کتاب</label><input id="title" autoFocus value={form.title} onChange={(e) => change('title', e.target.value)} placeholder="مثلاً Family and Friends 3" /></div>
          <div className="field field--full"><label htmlFor="cover">آدرس تصویر جلد</label><input id="cover" dir="ltr" value={form.coverUrl} onChange={(e) => { change('coverUrl', e.target.value); setImageFailed(false) }} placeholder="https://..." /></div>
          <div className="field field--full"><label htmlFor="coverAlt">متن جایگزین تصویر</label><input id="coverAlt" value={form.coverAlt || ''} onChange={(e) => change('coverAlt', e.target.value)} placeholder="جلد کتاب…" /></div>
          <div className="form-grid">
            <NumberField label="قیمت اصلی (تومان)" value={form.price} min={1} onChange={(value) => change('price', value)} />
            <NumberField label="قیمت فروش (تومان)" value={form.discountedPrice} min={0} onChange={(value) => change('discountedPrice', value)} />
            <NumberField label="درصد تخفیف" value={form.discountPercent} min={0} max={100} onChange={(value) => change('discountPercent', value)} />
            <NumberField label="درصد موجودی" value={form.remainingPercent} min={0} max={100} onChange={(value) => change('remainingPercent', value)} />
            <NumberField label="ترتیب نمایش" value={form.sortOrder} min={0} max={100000} onChange={(value) => change('sortOrder', value)} />
            <label className="switch-field"><span>وضعیت نمایش</span><span className="switch-row"><input type="checkbox" checked={form.active} onChange={(e) => change('active', e.target.checked)} /><span>{form.active ? 'فعال در فروشگاه' : 'غیرفعال'}</span></span></label>
          </div>
          {(localError || error) && <div className="alert alert--error">{localError || error}</div>}
          <footer className="drawer__footer"><button type="button" className="button button--secondary" onClick={onClose}>انصراف</button><button className="button button--primary" disabled={pending}>{pending && <LoaderCircle className="spin" />}{item ? 'ذخیره تغییرات' : 'افزودن به پرفروش‌ها'}</button></footer>
        </form>
      </section>
    </div>
  )
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max?: number; onChange: (value: number) => void }) {
  return <div className="field"><label>{label}</label><input type="number" dir="ltr" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>
}
