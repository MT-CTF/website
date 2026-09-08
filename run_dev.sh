bun run nodemon -e js,eta --exec "bun --env-file .dev.env ./serve.js" &

bunx @tailwindcss/cli -i ./src/style.css -o ./public/output.css --watch &

wait
