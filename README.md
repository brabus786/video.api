# Video Call API

Минимальный бэкенд для видео-звонков с WebRTC signaling через Socket.IO.

## Возможности

- ✅ Генерация уникальных ссылок с токенами (TTL: 15 минут)
- ✅ WebRTC signaling через Socket.IO
- ✅ Модульная архитектура
- ✅ В памяти хранилище (легко мигрировать на Redis)
- ✅ REST API + WebSocket

## Установка

```bash
yarn install
```

## Настройка

Создайте файл `.env`:

```bash
cp .env.example .env
```

Настройте переменные окружения в `.env`:

```env
PORT=3000
NODE_ENV=development
TOKEN_EXPIRY_MINUTES=15
CORS_ORIGIN=*
```

## Запуск

### Production
```bash
yarn start
```

### Development (с автоперезагрузкой)
```bash
yarn dev
```

## API

### REST Endpoints

#### 1. Создать комнату
```http
POST /api/room/create
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "token": "uuid",
    "link": "http://localhost:3000/join/token",
    "expiresAt": "2026-03-08T12:00:00Z",
    "expiresIn": "15 minutes"
  }
}
```

#### 2. Проверить токен
```http
GET /api/room/:token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "participantsCount": 0,
    "maxParticipants": 2,
    "isAvailable": true,
    "expiresAt": "2026-03-08T12:00:00Z"
  }
}
```

#### 3. Health check
```http
GET /health
```

### WebSocket Events

#### Client → Server

**Присоединиться к комнате:**
```javascript
socket.emit('join-room', { token }, (response) => {
  console.log(response); // { success: true, roomId, participantsCount }
});
```

**Отправить Offer:**
```javascript
socket.emit('offer', { offer, roomId });
```

**Отправить Answer:**
```javascript
socket.emit('answer', { answer, roomId });
```

**Отправить ICE Candidate:**
```javascript
socket.emit('ice-candidate', { candidate, roomId });
```

**Покинуть комнату:**
```javascript
socket.emit('leave-room', { roomId });
```

#### Server → Client

**Пользователь присоединился:**
```javascript
socket.on('user-joined', ({ socketId, participantsCount }) => {
  // Инициировать WebRTC соединение
});
```

**Получен Offer:**
```javascript
socket.on('offer', ({ offer, senderId }) => {
  // Обработать offer и отправить answer
});
```

**Получен Answer:**
```javascript
socket.on('answer', ({ answer, senderId }) => {
  // Завершить WebRTC соединение
});
```

**Получен ICE Candidate:**
```javascript
socket.on('ice-candidate', ({ candidate, senderId }) => {
  // Добавить ICE candidate
});
```

**Пользователь покинул комнату:**
```javascript
socket.on('user-left', ({ socketId, participantsCount }) => {
  // Закрыть соединение
});
```

## Архитектура

```
src/
├── app.js                 # Главный файл приложения
├── config/
│   └── config.js         # Конфигурация
├── controllers/
│   └── roomController.js # REST API контроллер
├── services/
│   ├── tokenService.js   # Управление токенами
│   └── roomService.js    # Управление комнатами
└── socket/
    └── signaling.js      # WebRTC signaling логика
```

## Масштабирование

Для production рекомендуется:

1. **Redis** вместо in-memory хранилища
   - Замените Map в токен и room сервисах на Redis
   
2. **Socket.IO Redis Adapter** для горизонтального масштабирования
   ```javascript
   const { createAdapter } = require('@socket.io/redis-adapter');
   io.adapter(createAdapter(pubClient, subClient));
   ```

3. **Database** для персистентности
   - PostgreSQL/MongoDB для истории звонков
   
4. **Load Balancer** 
   - Nginx/HAProxy с sticky sessions

## Пример использования

```javascript
// Client-side
const socket = io('http://localhost:3000');

// Получение токена от API
const response = await fetch('http://localhost:3000/api/room/create', {
  method: 'POST'
});
const { data } = await response.json();
console.log('Поделитесь этой ссылкой:', data.link);

// Присоединение к комнате
socket.emit('join-room', { token: data.token }, (response) => {
  if (response.success) {
    console.log('Присоединился к комнате:', response.roomId);
  }
});
```

## License

ISC
