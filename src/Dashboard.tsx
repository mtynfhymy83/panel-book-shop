import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, BarChart3, BookOpen, Check, ChevronDown, CircleHelp, Edit3, Eye,
  LayoutDashboard, Library, LoaderCircle, LogOut, Menu, Package, Plus, Search,
  Settings, ShoppingBag, Trash2, TrendingUp, Users, X,
} from 'lucide-react'
import { ApiError, bestSellersApi } from './api'
import { useAuth } from './AuthContext'
import { BestSellerForm } from './BestSellerForm'
import type { BestSeller, BestSellerPayload } from './types'

const number = new Intl.NumberFormat('fa-IR')
const toman = (value: number) => `${number.format(value)} تومان`

export function Dashboard() {
  const queryClient = useQueryClient()
  const { user, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [editing, setEditing] = useState<BestSeller | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<BestSeller | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [notice, setNotice] = useState('')
  const searchTimer = useRef(0)

  const list = useQuery({
    queryKey: ['best-sellers', debouncedQuery],
    queryFn: () => bestSellersApi.list(debouncedQuery),
  })
  const items = useMemo(() => list.data || [], [list.data])

  const save = useMutation({
    mutationFn: ({ payload, item }: { payload: BestSellerPayload; item: BestSeller | null }) => item ? bestSellersApi.update(item.id, payload) : bestSellersApi.create(payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['best-sellers'] })
      setEditing(undefined)
      showNotice(variables.item ? 'تغییرات با موفقیت ذخیره شد.' : 'کتاب به فهرست پرفروش‌ها اضافه شد.')
    },
  })

  const remove = useMutation({
    mutationFn: (item: BestSeller) => bestSellersApi.remove(item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['best-sellers'] })
      setDeleting(null)
      showNotice('کتاب از فهرست پرفروش‌ها حذف شد.')
    },
  })

  const toggle = useMutation({
    mutationFn: (item: BestSeller) => bestSellersApi.update(item.id, {
      title: item.title, coverUrl: item.coverUrl, coverAlt: item.coverAlt, price: item.price,
      discountedPrice: item.discountedPrice, discountPercent: item.discountPercent,
      remainingPercent: item.remainingPercent, sortOrder: item.sortOrder, active: !item.active,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['best-sellers'] }),
  })

  const stats = useMemo(() => ({
    all: items.length,
    active: items.filter((item) => item.active).length,
    discounted: items.filter((item) => item.discountPercent > 0).length,
  }), [items])

  function handleSearch(value: string) {
    setQuery(value)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setDebouncedQuery(value.trim()), 350)
  }
  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const accessDenied = list.error instanceof ApiError && list.error.status === 403

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar--open' : ''}`}>
        <div className="sidebar__head"><div className="brand"><span className="brand__mark"><BookOpen /></span><span>کتابسرای پردیس<small>پنل مدیریت</small></span></div><button className="icon-button sidebar__close" onClick={() => setMobileNav(false)}><X /></button></div>
        <nav className="nav">
          <NavItem icon={<LayoutDashboard />} label="پیشخوان" />
          <NavItem icon={<ShoppingBag />} label="سفارش‌ها" />
          <NavItem icon={<Package />} label="محصولات" />
          <NavItem icon={<TrendingUp />} label="پرفروش‌ها" active />
          <NavItem icon={<Users />} label="مشتریان" />
          <NavItem icon={<BarChart3 />} label="گزارش‌ها" />
          <div className="nav__divider" />
          <NavItem icon={<Settings />} label="تنظیمات" />
          <NavItem icon={<CircleHelp />} label="راهنما" />
        </nav>
        <div className="sidebar__user"><div className="avatar">{(user?.name || 'م').slice(0, 1)}</div><div><b>{user?.name || 'مدیر فروشگاه'}</b><small dir="ltr">{user?.phone}</small></div><button className="icon-button" title="خروج" onClick={() => signOut()}><LogOut /></button></div>
      </aside>
      {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="بستن منو" />}

      <main className="main-content">
        <header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileNav(true)}><Menu /></button><div className="breadcrumb"><span>محصولات</span><span>/</span><b>پرفروش‌ها</b></div><div className="topbar__account"><div className="avatar avatar--small">{(user?.name || 'م').slice(0, 1)}</div><span>{user?.name || 'مدیر فروشگاه'}</span><ChevronDown /></div></header>
        <div className="page">
          <section className="page-heading"><div><span className="eyebrow eyebrow--dark">ویترین فروشگاه</span><h1>مدیریت پرفروش‌ها</h1><p>کتاب‌های بخش پرفروش سایت را اضافه، مرتب و به‌روزرسانی کنید.</p></div><button className="button button--primary" onClick={() => { save.reset(); setEditing(null) }}><Plus /> افزودن کتاب</button></section>

          <section className="stats-grid">
            <Stat icon={<Library />} label="کل کتاب‌ها" value={stats.all} color="green" />
            <Stat icon={<Eye />} label="فعال در سایت" value={stats.active} color="blue" />
            <Stat icon={<TrendingUp />} label="دارای تخفیف" value={stats.discounted} color="orange" />
          </section>

          <section className="panel">
            <header className="panel__head"><div><h2>فهرست پرفروش‌ها</h2><p>{number.format(items.length)} کتاب در این فهرست</p></div><div className="search-box"><Search /><input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="جست‌وجوی نام کتاب..." />{query && <button onClick={() => handleSearch('')}><X /></button>}</div></header>

            {list.isLoading ? <State icon={<LoaderCircle className="spin" />} title="در حال دریافت فهرست…" />
              : accessDenied ? <State icon={<AlertTriangle />} title="دسترسی مدیریت فعال نیست" description="این شماره با موفقیت وارد شده، اما مجوز catalog.read ندارد. نقش مدیر یا مدیر محتوا را برای این حساب فعال کنید." action={<button className="button button--secondary" onClick={() => signOut()}>ورود با حساب دیگر</button>} />
              : list.isError ? <State icon={<AlertTriangle />} title="دریافت اطلاعات انجام نشد" description={list.error instanceof Error ? list.error.message : 'اتصال با سرور را بررسی کنید.'} action={<button className="button button--secondary" onClick={() => list.refetch()}>تلاش دوباره</button>} />
              : items.length === 0 ? <State icon={<BookOpen />} title={debouncedQuery ? 'کتابی پیدا نشد' : 'هنوز کتابی ثبت نشده'} description={debouncedQuery ? 'عبارت جست‌وجو را تغییر دهید.' : 'اولین کتاب پرفروش را به ویترین اضافه کنید.'} action={!debouncedQuery ? <button className="button button--primary" onClick={() => setEditing(null)}><Plus /> افزودن کتاب</button> : undefined} />
              : <div className="table-wrap"><table><thead><tr><th>کتاب</th><th>قیمت اصلی</th><th>قیمت فروش</th><th>تخفیف</th><th>موجودی</th><th>ترتیب</th><th>وضعیت</th><th><span className="sr-only">عملیات</span></th></tr></thead><tbody>{items.map((item) => <BestSellerRow key={item.id} item={item} onEdit={() => { save.reset(); setEditing(item) }} onDelete={() => { remove.reset(); setDeleting(item) }} onToggle={() => toggle.mutate(item)} togglePending={toggle.isPending} />)}</tbody></table></div>}
          </section>
        </div>
      </main>

      {editing !== undefined && <BestSellerForm item={editing} pending={save.isPending} error={save.error instanceof Error ? save.error.message : ''} onClose={() => setEditing(undefined)} onSubmit={(payload) => save.mutate({ payload, item: editing })} />}
      {deleting && <ConfirmDelete item={deleting} pending={remove.isPending} error={remove.error instanceof Error ? remove.error.message : ''} onCancel={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting)} />}
      {notice && <div className="toast"><Check />{notice}</div>}
    </div>
  )
}

function NavItem({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return <button className={`nav__item ${active ? 'nav__item--active' : ''}`}>{icon}<span>{label}</span>{active && <span className="nav__active-mark" />}</button>
}

function Stat({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return <article className="stat"><span className={`stat__icon stat__icon--${color}`}>{icon}</span><div><span>{label}</span><strong>{number.format(value)}</strong></div></article>
}

function State({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="state"><span className="state__icon">{icon}</span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>
}

function BestSellerRow({ item, onEdit, onDelete, onToggle, togglePending }: { item: BestSeller; onEdit: () => void; onDelete: () => void; onToggle: () => void; togglePending: boolean }) {
  return <tr>
    <td><div className="book-cell"><img src={item.coverUrl} alt={item.coverAlt || `جلد ${item.title}`} /><div><b>{item.title}</b><small dir="ltr">{item.id}</small></div></div></td>
    <td className="price price--old">{toman(item.price)}</td><td className="price">{toman(item.discountedPrice)}</td>
    <td><span className="discount-badge">{number.format(item.discountPercent)}٪</span></td>
    <td><div className="stock"><span>{number.format(item.remainingPercent)}٪</span><span className="stock__bar"><i style={{ width: `${item.remainingPercent}%` }} /></span></div></td>
    <td>{number.format(item.sortOrder)}</td>
    <td><button className={`status ${item.active ? 'status--active' : ''}`} disabled={togglePending} onClick={onToggle}><i />{item.active ? 'فعال' : 'غیرفعال'}</button></td>
    <td><div className="row-actions"><button className="icon-button" title="ویرایش" onClick={onEdit}><Edit3 /></button><button className="icon-button icon-button--danger" title="حذف" onClick={onDelete}><Trash2 /></button></div></td>
  </tr>
}

function ConfirmDelete({ item, pending, error, onCancel, onConfirm }: { item: BestSeller; pending: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop"><section className="confirm" role="alertdialog"><span className="confirm__icon"><Trash2 /></span><h2>حذف از پرفروش‌ها؟</h2><p>«{item.title}» از این فهرست حذف می‌شود. این عملیات قابل بازگشت نیست.</p>{error && <div className="alert alert--error">{error}</div>}<div><button className="button button--secondary" onClick={onCancel}>انصراف</button><button className="button button--danger" disabled={pending} onClick={onConfirm}>{pending && <LoaderCircle className="spin" />} حذف کتاب</button></div></section></div>
}
