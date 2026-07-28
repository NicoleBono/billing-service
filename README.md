# Billing Service — Orçamento e Pagamento (Fase 4)

Microsserviço responsável por **gerar orçamentos** e **processar pagamentos** (via **Mercado Pago**) das ordens de serviço da oficina mecânica. Parte da migração para microsserviços da Fase 4 do Tech Challenge — reage a eventos publicados pelo [OS Service](https://github.com/NicoleBono/challenge-oficina) (orquestrador da Saga) via SNS/SQS.

Ver [ADR-004](https://github.com/NicoleBono/challenge-oficina/blob/main/docs/adr/ADR-004-saga-orquestrada.md) e [ADR-005](https://github.com/NicoleBono/challenge-oficina/blob/main/docs/adr/ADR-005-sns-sqs-como-mensageria.md) no repositório do OS Service para o desenho completo da Saga.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Framework | NestJS 10 + TypeScript |
| Banco | MongoDB (Mongoose) / AWS DocumentDB em produção |
| Pagamentos | Mercado Pago (SDK oficial) |
| Mensageria (Saga) | AWS SNS + SQS |
| Infraestrutura | Kubernetes + HPA |
| Monitoramento | Datadog (APM + logs) |
| CI/CD | GitHub Actions + SonarCloud |

## Arquitetura

```
src/
├── budgets/     # Geração, aprovação e anulação de orçamentos
├── payments/    # Cobrança via Mercado Pago + webhook de confirmação
├── saga/        # Publisher (SNS) + consumer (SQS) + handlers de evento
├── health/      # Health check (ping MongoDB)
└── common/      # Erros de domínio, filtro de exceção, logging
```

Mesma arquitetura hexagonal (DDD) usada no OS Service: `domain/{entities,repositories}`, `application/use-cases`, `infra/{controllers,mongo,mappers}`.

## Fluxo de eventos consumidos/publicados

| Evento | Direção | Efeito |
|---|---|---|
| `OS_CREATED` | consome | gera orçamento inicial, publica `BUDGET_GENERATED` |
| `ADDITIONAL_REQUESTED` | consome | gera orçamento suplementar, publica `BUDGET_GENERATED` |
| `BUDGET_APPROVAL_DECIDED` | consome | aprovado → cria cobrança no Mercado Pago; rejeitado → anula o orçamento |
| `PAYMENT_CONFIRMED` / `PAYMENT_FAILED` | publica | disparado pelo webhook do Mercado Pago |

## Execução local

### Pré-requisitos
- Node.js 20+, Docker, Docker Compose

```bash
npm install
docker-compose up -d mongo
npm run start:dev
```

API disponível em `http://localhost:3000/billing`
Swagger em `http://localhost:3000/billing/swagger/api-docs`

## Execução com Docker Compose completo

```bash
docker-compose up --build
```

Sem `SAGA_SNS_TOPIC_ARN`/`SAGA_SQS_QUEUE_URL` configurados, o publisher/consumer apenas loga um aviso (degradação graciosa) — os endpoints REST continuam funcionando normalmente.

## Deploy no Kubernetes

```bash
# Namespace "oficina" já criado pelo challenge-oficina (OS Service)
kubectl apply -f k8s/
kubectl get all -n oficina -l app=billing-service
```

## Endpoints principais

| Rota | Auth | Descrição |
|------|------|-----------|
| `GET /billing/budgets/:workOrderId` | JWT | Orçamento mais recente da OS |
| `GET /billing/payments/:workOrderId` | JWT | Pagamento mais recente da OS |
| `POST /billing/webhooks/mercadopago` | pública | Webhook de notificação do Mercado Pago |
| `GET /billing/health` | pública | Health check |

Roteado pelo Kong a partir do path `/billing` (ver `k8s/kong/kong-config.yaml` no repo `challenge-oficina`).

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string MongoDB/DocumentDB |
| `MP_ACCESS_TOKEN` | Access token do Mercado Pago (sandbox ou produção) |
| `MP_WEBHOOK_URL` | URL pública do webhook (configurada na preferência de pagamento) |
| `PORT` | Porta da API (padrão: 3000) |
| `AWS_REGION` | Região AWS do SNS/SQS |
| `SAGA_SNS_TOPIC_ARN` | ARN do tópico SNS da Saga |
| `SAGA_SQS_QUEUE_URL` | URL da fila SQS deste serviço |
| `AWS_ENDPOINT_URL` | Opcional — endpoint do LocalStack para desenvolvimento local |
| `DD_API_KEY` | API Key do Datadog |

## Testes

```bash
npm test               # unitários (cobertura ≥80%, ver jest.config.js)
npm run test:coverage  # com relatório de cobertura
npm run test:bdd       # fluxo completo em Gherkin (jest-cucumber)
```

Cenário BDD em [test/bdd/features/budget-approval.feature](test/bdd/features/budget-approval.feature): cliente aprova orçamento → cobrança criada no Mercado Pago → pagamento confirmado via webhook (e o cenário de rejeição/compensação).

## CI/CD

Pipeline em [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml):

1. **test** — testes unitários + BDD com Mongo efêmero, cobertura ≥80%, análise SonarCloud
2. **build** — build e push Docker para GHCR (branches `main` e `homolog`)
3. **deploy-homolog** — deploy automático em homologação
4. **deploy-prod** — deploy automático em produção (requer aprovação)

## Repositórios relacionados

| Repo | Descrição |
|------|-----------|
| [challenge-oficina](https://github.com/NicoleBono/challenge-oficina) | OS Service (orquestrador da Saga) |
| [execution-service](https://github.com/NicoleBono/execution-service) | Fila de execução/diagnóstico |
| [infra-kubernetes](https://github.com/NicoleBono/infra-kubernetes) | Terraform EKS + Kong + SNS/SQS |
| [infra-database](https://github.com/NicoleBono/infra-database) | Terraform RDS PostgreSQL + DocumentDB |
