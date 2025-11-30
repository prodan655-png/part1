# Налаштування Бази Даних та Docker

Для роботи API необхідна база даних PostgreSQL та Redis. Найпростіший спосіб їх запустити - використати Docker.

## Крок 1: Встановлення Docker Desktop

1.  Завантажте **Docker Desktop for Mac** з офіційного сайту:
    [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
    *(Оберіть версію для вашого чіпа: Apple Silicon (M1/M2/M3) або Intel)*.
2.  Встановіть та запустіть програму Docker.
3.  Зачекайте, поки в статус-барі (внизу вікна Docker) з'явиться зелений індикатор "Engine running".

## Крок 2: Запуск Бази Даних

Відкрийте термінал в корені проєкту (`part1`) та виконайте команду:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Ця команда завантажить та запустить PostgreSQL та Redis у фоновому режимі.

## Крок 3: Налаштування Схеми (Prisma)

Після запуску бази даних потрібно створити в ній таблиці. Виконайте наступні команди:

```bash
# Переходимо в папку API
cd apps/api

# Запускаємо міграції (створення таблиць)
pnpm exec prisma migrate dev --name init
```

Якщо все пройшло успішно, ви побачите повідомлення `migrations have been successfully applied`.

## Крок 4: Запуск API

Тепер можна запускати сервер:

```bash
pnpm dev
```

Сервер має запуститися на порту 3001 без помилок.

---

### Корисні команди

- **Зупинити базу даних:**
  ```bash
  docker compose -f docker/docker-compose.yml down
  ```
- **Перевірити статус контейнерів:**
  ```bash
  docker ps
  ```
