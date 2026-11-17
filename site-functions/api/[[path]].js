// Переходник: запросы игры /api/* уходят на сервер gorod-bot
const API = 'https://gorod-bot.ishkin-tembur001.workers.dev';
export async function onRequest({ request }) {
  const u = new URL(request.url);
  return fetch(new Request(API + u.pathname + u.search, request));
}
