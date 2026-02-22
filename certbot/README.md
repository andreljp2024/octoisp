# Certbot (Renovação automática)

Este container renova certificados Let’s Encrypt automaticamente.

Volumes esperados:

- `./certbot/conf:/etc/letsencrypt`
- `./certbot/www:/var/www/certbot`

Use junto com o `nginx.prod.conf` (rota `/.well-known/acme-challenge`).
