FROM nginx:alpine

# Listen ports
EXPOSE 80

COPY src/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY spa /usr/share/nginx/html
