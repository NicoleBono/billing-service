# language: pt
Funcionalidade: Geração e aprovação de orçamento

  Cenário: Orçamento criado ao receber evento os.created
    Dado que o evento "os.created" é recebido para a OS 1
    Quando o billing-service processa o evento
    Então um orçamento com status "PENDENTE" deve ser criado para a OS 1

  Cenário: Orçamento aprovado pelo cliente
    Dado que existe um orçamento PENDENTE para a OS 2 com total R$ 500,00
    Quando o atendente aprova o orçamento da OS 2
    Então o orçamento deve ter status "APROVADO"
    E o evento "budget.approved" deve ser publicado com totalAmount 500.00

  Cenário: Rollback - orçamento rejeitado
    Dado que existe um orçamento PENDENTE para a OS 3
    Quando o cliente rejeita o orçamento
    Então o orçamento deve ter status "REJEITADO"
    E o evento "budget.rejected" deve ser publicado
