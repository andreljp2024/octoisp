FROM certbot/certbot:latest

RUN apk add --no-cache bash

CMD ["sh", "-c", "while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h; done"]
