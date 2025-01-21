# album
Aplicativo Web para gerenciamento e visualização de álbuns de fotos.

```bash
npm run dev
npm run test
```

```bash
npm run build
npm start --prefix backend
```

```bash
docker-compose up --build
npx prisma migrate dev
docker exec -it <container_name> npx prisma migrate deploy

docker exec -it album-db-1 psql -U postgres -d album

docker-compose rm
docker volume ls
docker volume rm album_db-data
```

## Bibliotecas utilizadas
- Backend
  - Prisma -> ORM para o PostgreSQL
  - Express -> Framework Web
  - dev:Nodemon -> Reinicia o servidor após alterações
- Frontend
  - Axios -> Para requisições HTTP
  - Vite -> Para construção do frontend 
  - React
  - ESLint
- Dev / Testes
  - Chai -> Assertion Library
  - Mocha -> Framework de testes
  - Supertest -> Teste dos endpoints HTTP
  - Concurrently