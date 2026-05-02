#!/bin/bash
# Запускать на VPS после git pull
# Путь: /var/www/zvoni
set -e

echo "=== Обновление зависимостей ==="
pnpm install

echo "=== Сборка ==="
pnpm --filter api db:generate
pnpm --filter web build

echo "=== Миграции БД ==="
cd apps/api
npx prisma migrate deploy
cd ../..

echo "=== Обновление nginx ==="
sudo cp nginx.conf /etc/nginx/sites-available/zvoni
sudo ln -sf /etc/nginx/sites-available/zvoni /etc/nginx/sites-enabled/zvoni
sudo nginx -t && sudo systemctl reload nginx

echo "=== Открытие портов для LiveKit (WebRTC UDP) ==="
sudo ufw allow 7880/tcp   # LiveKit WebSocket signaling
sudo ufw allow 7881/tcp   # LiveKit RTC TCP
sudo ufw allow 50100:50200/udp  # LiveKit ICE / media UDP
sudo ufw status

echo "=== Готово. Перезапустить PM2: pm2 restart all ==="
