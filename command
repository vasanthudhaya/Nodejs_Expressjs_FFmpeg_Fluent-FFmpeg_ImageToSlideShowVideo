pm2 start npm --name "imagetovideo" -- start


sudo ln -s /etc/nginx/sites-available/imagetovideo /etc/nginx/sites-enabled/

sudo nginx -t
sudo nginx -s reload
