FROM node:18-alpine

# dumb-init zabraňuje vzniku "zombie" procesov, ktoré žerú 100% CPU
RUN apk add --no-cache dumb-init chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto-emoji

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4008

# Použitie dumb-init ako entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]