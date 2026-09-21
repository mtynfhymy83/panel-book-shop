import { useState, type DragEvent, type FormEvent } from 'react'
import { ImageOff, LoaderCircle, UploadCloud, X } from 'lucide-react'
import { bestSellersApi } from './api'
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
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  const change = <K extends keyof BestSellerPayload>(key: K, value: BestSellerPayload[K]) => setForm((current) => ({ ...current, [key]: value }))

  function submit(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    if (uploading) return setLocalError('لطفاً تا پایان بارگذاری تصویر صبر کنید.')
    if (!form.title.trim() || !form.coverUrl.trim()) return setLocalError('عنوان و تصویر جلد الزامی هستند.')
    if (form.price < 1 || form.discountedPrice < 0 || form.discountedPrice > form.price) return setLocalError('قیمت‌ها معتبر نیستند؛ قیمت فروش نباید بیشتر از قیمت اصلی باشد.')
    if ([form.discountPercent, form.remainingPercent].some((value) => value < 0 || value > 100)) return setLocalError('درصدها باید بین صفر تا صد باشند.')
    onSubmit({ ...form, title: form.title.trim(), coverUrl: form.coverUrl.trim(), coverAlt: form.coverAlt?.trim() || null })
  }

  async function upload(file?: File) {
    if (!file) return
    setUploadError('')
    setLocalError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setUploadError('فقط تصویر JPG، PNG یا WebP مجاز است.')
    }
    if (file.size > 5 * 1024 * 1024) {
      return setUploadError('حجم تصویر باید حداکثر ۵ مگابایت باشد.')
    }

    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    setImageFailed(false)
    setUploading(true)
    try {
      const result = await bestSellersApi.uploadCover(file)
      change('coverUrl', result.coverUrl)
    } catch (uploadFailure) {
      setUploadError(uploadFailure instanceof Error ? uploadFailure.message : 'بارگذاری تصویر انجام نشد.')
    } finally {
      setLocalPreview('')
      URL.revokeObjectURL(preview)
      setUploading(false)
    }
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    if (!uploading) void upload(event.dataTransfer.files[0])
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
            {(localPreview || form.coverUrl) && !imageFailed ? <img src={localPreview || form.coverUrl} alt="پیش‌نمایش جلد" onError={() => setImageFailed(true)} /> : <div><ImageOff /><span>پیش‌نمایش جلد</span></div>}
          </div>
          <div className="field field--full"><label htmlFor="title">عنوان کتاب</label><input id="title" autoFocus value={form.title} onChange={(e) => change('title', e.target.value)} placeholder="مثلاً Family and Friends 3" /></div>
          <div className="field field--full">
            <span className="field__label">تصویر جلد</span>
            <label className={`cover-upload ${uploading ? 'cover-upload--pending' : ''}`} htmlFor="cover" onDragOver={(event) => event.preventDefault()} onDrop={drop}>
              <input id="cover" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = '' }} />
              {uploading ? <LoaderCircle className="spin" /> : <UploadCloud />}
              <span><b>{uploading ? 'در حال بارگذاری…' : form.coverUrl ? 'تغییر تصویر جلد' : 'انتخاب تصویر جلد'}</b><small>JPG، PNG یا WebP — حداکثر ۵ مگابایت</small></span>
            </label>
            {uploadError && <div className="field-error">{uploadError}</div>}
          </div>
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
          <footer className="drawer__footer"><button type="button" className="button button--secondary" onClick={onClose}>انصراف</button><button className="button button--primary" disabled={pending || uploading}>{(pending || uploading) && <LoaderCircle className="spin" />}{item ? 'ذخیره تغییرات' : 'افزودن به پرفروش‌ها'}</button></footer>
        </form>
      </section>
    </div>
  )
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max?: number; onChange: (value: number) => void }) {
  return <div className="field"><label>{label}</label><input type="number" dir="ltr" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /></div>
}
