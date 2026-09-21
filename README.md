# پنل مدیریت کتابسرای پردیس

فرانت مستقل پنل مدیریت با React، TypeScript و Vite. ورود با نام کاربری و رمز عبور و مدیریت کامل پرفروش‌ها (نمایش، جست‌وجو، افزودن، ویرایش، فعال/غیرفعال‌کردن و حذف) به API پروژه متصل است. نشست ادمین با refresh token امن تا ۳۰ روز معتبر می‌ماند.

## اجرا

```bash
npm install
npm run dev
```

پنل روی `http://localhost:5174` اجرا می‌شود و Vite مسیر `/api` را به بک‌اند `http://localhost:9502` پراکسی می‌کند. برای API دیگر فایل `.env.local` بسازید:

```env
VITE_API_URL=https://example.com/api/v1
```

حساب واردشده برای مشاهده فهرست به مجوز `catalog.read` و برای تغییرات به `catalog.write` نیاز دارد. ساخت حساب ادمین در README اصلی بک‌اند توضیح داده شده است.

## بررسی

```bash
npm run typecheck
npm run lint
npm run build
```
# panel-book-shop
# panel-book-shop
# panel-book-shop
