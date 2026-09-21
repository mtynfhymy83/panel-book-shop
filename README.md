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

## Docker و استقرار روی Dokploy

ایمیج production به‌صورت multi-stage ساخته می‌شود و خروجی Vite را با Nginx روی پورت `80` سرو می‌کند. مسیرهای SPA به `index.html` برمی‌گردند و درخواست‌های `/api/*` به بک‌اند پراکسی می‌شوند.

برای تست محلی:

```bash
docker build -t pardis-book-admin .
docker run --rm -p 8080:80 \
  -e API_UPSTREAM=http://host.docker.internal:9502 \
  pardis-book-admin
```

سپس پنل در `http://localhost:8080` در دسترس است. مقدار `API_UPSTREAM` فقط origin بک‌اند است (برای مثال `https://api.example.com`) و نباید `/api/v1` در انتهای آن قرار بگیرد؛ خود فرانت درخواست‌ها را با این مسیر ارسال می‌کند.

### ۱. تنظیم GitHub Actions و Docker Hub

1. در Docker Hub یک repository با نام `pardis-book-admin` بسازید.
2. در Docker Hub یک Personal Access Token با دسترسی Read/Write بسازید.
3. در GitHub به `Settings > Secrets and variables > Actions` بروید و این Repository Secretها را اضافه کنید:
   - `DOCKERHUB_USERNAME`: نام کاربری Docker Hub
   - `DOCKERHUB_TOKEN`: توکن Docker Hub
4. کد را روی شاخه `main` push کنید.

Workflow فایل `.github/workflows/docker.yml` ابتدا ایمیج را build می‌کند و سپس این tagها را منتشر می‌کند:

- `latest` و `main` برای آخرین نسخه شاخه اصلی
- `sha-...` برای نسخه دقیق هر commit
- tag متناظر برای Git tagهایی مانند `v1.0.0`

Pull Requestها فقط build می‌شوند و هیچ ایمیجی push نمی‌کنند.

### ۲. ساخت Application در Dokploy

1. یک Application جدید بسازید و Provider/Source را روی `Docker` قرار دهید.
2. نام ایمیج را به شکل `DOCKERHUB_USERNAME/pardis-book-admin` و Tag را `latest` وارد کنید.
3. Container Port را `80` تنظیم کنید.
4. در بخش Environment این مقدار را اضافه کنید:

```env
API_UPSTREAM=https://api.example.com
```

5. Domain و HTTPS را در Dokploy تنظیم کنید و اولین Deploy را اجرا کنید.
6. برای repository خصوصی، credential رجیستری Docker Hub را در Dokploy تنظیم کنید.

### ۳. Auto Deploy پس از push

در Application وارد تب `Deployments` شوید و Webhook URL را کپی کنید. سپس در repository مربوطه در Docker Hub، بخش `Webhooks`، همان URL را ثبت کنید. از آن پس انتشار tag `latest` توسط GitHub Actions باعث deploy خودکار در Dokploy می‌شود. Tag تنظیم‌شده در Dokploy باید دقیقاً `latest` باشد.

Health check کانتینر از مسیر `/healthz` انجام می‌شود و باید پاسخ `200` برگرداند.
