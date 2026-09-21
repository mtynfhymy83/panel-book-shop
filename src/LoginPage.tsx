import { useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { ApiError, authApi } from './api'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (username.trim().length < 3 || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید.')
      return
    }
    setLoading(true)
    try {
      const session = await authApi.login(username.trim().toLowerCase(), password)
      signIn(session)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'ورود انجام نشد. دوباره تلاش کنید.')
    } finally { setLoading(false) }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="brand brand--light"><span className="brand__mark"><BookOpen /></span><span>کتابسرای پردیس</span></div>
        <div className="login-intro__copy">
          <span className="eyebrow">پنل یکپارچه مدیریت</span>
          <h1>مدیریت فروشگاه،<br />ساده و متمرکز.</h1>
          <p>پرفروش‌ها را مرتب کنید، وضعیت انتشار را ببینید و محتوای ویترین را همیشه تازه نگه دارید.</p>
          <div className="intro-points">
            <span><CheckCircle2 /> اتصال مستقیم به API فروشگاه</span>
            <span><CheckCircle2 /> نشست امن و ماندگار تا یک ماه</span>
          </div>
        </div>
        <p className="login-intro__footer">سامانه داخلی کتابسرای پردیس</p>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <div className="login-card__icon"><ShieldCheck /></div>
          <span className="eyebrow eyebrow--dark">ورود مدیران</span>
          <h2>خوش آمدید</h2>
          <p className="muted">برای ورود به پنل، نام کاربری و رمز عبور حساب مدیریتی خود را وارد کنید.</p>

          <form onSubmit={login} className="form-stack">
            <label htmlFor="username">نام کاربری</label>
            <div className="input-with-icon" dir="ltr"><UserRound /><input id="username" autoFocus autoComplete="username" spellCheck={false} placeholder="admin" value={username} onChange={(event) => setUsername(event.target.value)} /></div>
            <label htmlFor="password">رمز عبور</label>
            <div className="input-with-icon password-input" dir="ltr">
              <LockKeyhole />
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="رمز عبور" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'پنهان‌کردن رمز عبور' : 'نمایش رمز عبور'}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </div>
            {error && <div className="alert alert--error">{error}</div>}
            <button className="button button--primary button--wide" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <>ورود به پنل <ArrowLeft /></>}</button>
            <p className="session-hint"><CheckCircle2 /> پس از ورود، نشست شما تا ۳۰ روز معتبر می‌ماند.</p>
          </form>
        </div>
      </section>
    </main>
  )
}
