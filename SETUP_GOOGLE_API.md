# Налаштування Google Search Console API

Цей гайд допоможе вам налаштувати доступ до Google Search Console API для імпорту даних про сторінки вашого сайту.

## Передумови

- Обліковий запис Google
- Доступ до Google Search Console для вашого сайту (svitpekaria.com.ua)
- Права власника або адміністратора property в GSC

---

## Крок 1: Створення проекту в Google Cloud Console

1. Відкрийте [Google Cloud Console](https://console.cloud.google.com/)
2. Натисніть **"Select a project"** → **"New Project"**
3. Введіть назву проекту: `SEO Audit Platform`
4. Натисніть **"Create"**
5. Зачекайте поки проект створюється (~30 секунд)

---

## Крок 2: Увімкнення Google Search Console API

1. У верхній панелі переконайтеся, що обрано ваш новий проект
2. Відкрийте меню (☰) → **"APIs & Services"** → **"Library"**
3. У пошуку введіть: `Google Search Console API`
4. Натисніть на **"Google Search Console API"**
5. Натисніть **"Enable"** (синя кнопка)
6. Зачекайте поки API активується

---

## Крок 3: Створення OAuth 2.0 Credentials

### 3.1 Налаштування OAuth Consent Screen

1. Відкрийте меню → **"APIs & Services"** → **"OAuth consent screen"**
2. Виберіть **"External"** → Натисніть **"Create"**
3. Заповніть форму:
   - **App name**: `SEO Audit Platform`
   - **User support email**: Ваш email
   - **Developer contact information**: Ваш email
4. Натисніть **"Save and Continue"**
5. На кроці **"Scopes"**:
   - Натисніть **"Add or Remove Scopes"**
   - Знайдіть та виберіть: `https://www.googleapis.com/auth/webmasters.readonly`
   - Натисніть **"Update"** → **"Save and Continue"**
6. На кроці **"Test users"**:
   - Натисніть **"Add Users"**
   - Додайте ваш Google email (той, що має доступ до GSC)
   - Натисніть **"Save and Continue"**
7. Перегляньте та натисніть **"Back to Dashboard"**

### 3.2 Створення OAuth Client ID

1. Відкрийте меню → **"APIs & Services"** → **"Credentials"**
2. Натисніть **"+ Create Credentials"** → **"OAuth client ID"**
3. Виберіть:
   - **Application type**: `Web application`
   - **Name**: `SEO Audit Web Client`
4. У розділі **"Authorized redirect URIs"** додайте:
   ```
   http://localhost:3001/api/gsc-auth/callback
   ```
5. Натисніть **"Create"**
6. У popup вікні з'являться ваші credentials:
   - **Client ID** (починається з `XXX.apps.googleusercontent.com`)
   - **Client Secret** (випадковий рядок)
7. **ВАЖЛИВО**: Скопіюйте обидва значення!

---

## Крок 4: Додавання Credentials в проект

Відкрийте файл `apps/api/.env` та додайте/оновіть наступні рядки:

```bash
# Google OAuth (замініть на ваші значення)
GOOGLE_CLIENT_ID=ваш_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/gsc-auth/callback
```

**Приклад:**
```bash
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
GOOGLE_CALLBACK_URL=http://localhost:3001/api/gsc-auth/callback
```

---

## Крок 5: Перевірка доступу до GSC

1. Відкрийте [Google Search Console](https://search.google.com/search-console)
2. Переконайтеся, що ви бачите property для `svitpekaria.com.ua`
3. Якщо property не знайдено:
   - Натисніть **"Add Property"**
   - Виберіть **"Domain"** та введіть `svitpekaria.com.ua`
   - Підтвердіть власність через DNS (інструкції на екрані)

---

## Крок 6: Перезапуск API сервера

Після додавання credentials в `.env` файл:

```bash
# Зупиніть поточний API сервер (Ctrl+C в терміналі)
# Запустіть знову
cd apps/api
pnpm dev
```

---

## Наступні кроки

Після налаштування credentials ви зможете:
1. Підключити Google Account через UI
2. Імпортувати сторінки з Google Search Console
3. Переглядати метрики (impressions, clicks, CTR, position)

**Готові продовжити?** Дайте знати, коли credentials додані в `.env` файл!

---

## Troubleshooting

### Помилка: "Access blocked: This app's request is invalid"
- Переконайтеся, що додали правильний **redirect URI** в Google Cloud Console
- URI має точно співпадати: `http://localhost:3001/api/auth/google/callback`

### Помилка: "Insufficient Permission"
- Переконайтеся, що додали scope `webmasters.readonly` в OAuth Consent Screen
- Перевірте, що ваш email додано як Test User

### API не працює після додавання credentials
- Перевірте, що немає зайвих пробілів в `.env` файлі
- Переконайтеся, що перезапустили API сервер

---

## Додаткові ресурси

- [Google Search Console API Documentation](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
