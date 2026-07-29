# Billing Service — Fase 4 FIAP SOAT

Microsserviço responsável por orçamentos e pagamentos das Ordens de Serviço.

## Tecnologias

- NestJS 11 + TypeScript
- PostgreSQL 16 + Prisma ORM
- AWS SNS (publicação de eventos) + AWS SQS (consumo de eventos)
- MercadoPago SDK (geração de link de pagamento)
- Docker + Kubernetes (EKS)

## Saga Pattern — Coreografado

Reage a eventos publicados pelo OS Service via SNS/SQS (coreografia, sem orquestrador central).

### Eventos consumidos (SQS)

| Evento | Ação |
|--------|------|
| `OS_CREATED` | Cria orçamento inicial |
| `BUDGET_APPROVAL_DECIDED` | Processa aprovação/rejeição do cliente |
| `EXECUTION_COMPLETED` | Finaliza cobrança |

### Eventos publicados (SNS)

| Evento | Quando | Destinatário |
|--------|--------|--------------|
| `BUDGET_GENERATED` | Orçamento montado | os-service |
| `PAYMENT_CONFIRMED` | Aprovação recebida | os-service |
| `PAYMENT_FAILED` | Rejeição recebida | os-service |
| `EXECUTION_REQUESTED` | Pagamento aprovado | execution-service |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/billing/:workOrderId` | Busca orçamento por OS |
| `GET` | `/health` | Health check |

## Rodando localmente

```bash
# Banco e LocalStack (SNS/SQS)
docker compose up -d

# Variáveis de ambiente
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_service
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
SAGA_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:oficina-saga
SAGA_SQS_QUEUE_URL=http://localhost:4566/000000000000/billing-service-queue
MP_ACCESS_TOKEN=TEST-xxxx

# Migrations
npx prisma migrate dev

# Iniciar
npm run start:dev
```

## Testes

```bash
npm test        # unitários
npm run test:cov # com cobertura
```

## Cobertura

![Tests](https://img.shields.io/badge/tests-1%20unit-yellow)

```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

Resultado obtido localmente em 2026-07-28.

## Kubernetes

Manifestos em [k8s/](k8s/):

| Arquivo | Descrição |
|---------|-----------|
| `deployment.yaml` | Deployment do billing-service |
| `service.yaml` | ClusterIP na porta 3000 |
| `configmap.yaml` | Variáveis de ambiente não-secretas |
| `secret.yaml` | DATABASE_URL e MP_ACCESS_TOKEN |
| `service-account.yaml` | ServiceAccount para IRSA (SNS/SQS) |

## CI/CD

Pipeline em [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml):

1. **test** — testes unitários + migrations em PostgreSQL efêmero
2. **build** — build e push Docker para GHCR (branches `main` e `homolog`)

## Repositórios relacionados

| Repo | Descrição |
|------|-----------|
| [challenge-oficina](https://github.com/NicoleBono/challenge-oficina) | OS Service (ponto de entrada da Saga) |
| [execution-service](https://github.com/NicoleBono/execution-service) | Fila de execução e diagnóstico |
