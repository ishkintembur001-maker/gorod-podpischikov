// Переходник сайта игры: всё, что относится к серверу, уходит на gorod-bot
const API = 'https://gorod-bot.ishkin-tembur001.workers.dev';
export async function onRequest({ request, next }) {
  const u = new URL(request.url);
  const toWorker = u.pathname.startsWith('/api/') || u.pathname === '/setup' ||
    (request.method === 'POST' && !u.pathname.startsWith('/game/')) || request.method === 'OPTIONS';
  if (!toWorker) return next();
  return fetch(new Request(API + u.pathname + u.search, request));
}
