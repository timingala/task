
# Build aşaması
FROM node:18-alpine AS builder
WORKDIR /app

# Package files kopyala
COPY package.json package-lock.json* ./
RUN npm ci

# Proje dosyalarını kopyala
COPY . .

# Next.js config için standalone output kullan
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production aşaması
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Güvenlik için user oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Build'den gerekli dosyaları kopyala
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
