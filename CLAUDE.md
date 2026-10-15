# Punto Neutro — instrucciones para Claude

- Antes de tocar código lee la skill `puntoneutro-frontend`; para cualquier cambio visual, `puntoneutro-ui`. Para consultas Prisma, `prisma-client-api` / `prisma-cli`.
- El producto se define en la propuesta de Punto Neutro (secciones, paleta Positive Feminism, Lora + Montserrat). No agregar secciones ni cambiar la paleta sin pedirlo.
- Textos de UI en español de Chile, tono empático y no culpabilizador.
- Verificación obligatoria: `pnpm typecheck && pnpm test && pnpm build`.
- Nunca `prisma migrate reset` ni borrar datos de bases que no sean de prueba.
- Despliegue: ver `DESPLIEGUE.md`.
