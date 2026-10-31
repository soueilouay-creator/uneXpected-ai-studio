FROM node:22-alpine
ENV NODE_ENV=production PORT=10000
WORKDIR /tmp/ue-source
COPY source.tar.gz.b64 /tmp/source.tar.gz.b64
RUN base64 -d /tmp/source.tar.gz.b64 > /tmp/source.tar.gz \
 && mkdir -p /tmp/ue-extracted /app \
 && tar -xzf /tmp/source.tar.gz -C /tmp/ue-extracted \
 && cp -R /tmp/ue-extracted/uneXpected-ai-studio-v1.0.1/. /app/ \
 && rm -rf /tmp/ue-source /tmp/ue-extracted /tmp/source.tar.gz /tmp/source.tar.gz.b64
WORKDIR /app
COPY app.js /app/public/app.js
COPY server.js /app/server.js
COPY openrouter-ui.js /app/openrouter-ui.js
COPY taaft-integration.mjs /app/taaft-integration.mjs
COPY mobile-assets.mjs /app/mobile-assets.mjs
COPY mobile-assets.parts/ /tmp/mobile-assets.parts/
RUN cat /tmp/mobile-assets.parts/part-*.b64 > /tmp/mobile-assets.tar.gz.b64 \
 && printf '%s  %s\n' 'd9316477b654ea04bc842a2f7ae158b2fffe3eab85f057d7bc3aa7a749f9f55e' /tmp/mobile-assets.tar.gz.b64 | sha256sum -c - \
 && mkdir -p /app/public \
 && base64 -d /tmp/mobile-assets.tar.gz.b64 | tar -xz -C /app/public \
 && rm -rf /tmp/mobile-assets.parts /tmp/mobile-assets.tar.gz.b64
EXPOSE 10000
USER node
CMD ["node", "server.js"]
