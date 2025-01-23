# album
> Em desenvolvimento

Aplicativo Web para gerenciamento e visualização de álbuns de fotos. 

## Executar
```bash
docker compose up --build
docker compose rm -fs
```

## Testes
```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit \
docker compose -f docker-compose.test.yml rm -fsv
```

```bash
npm run dev
npm run test

npm run build
npm start --prefix backend

# Acessar o bd
docker compose exec -it db psql -U postgres -d album

# Remove o BD
docker compose down -v
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
