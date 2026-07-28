Feature: Aprovação de orçamento e confirmação de pagamento
  Como orquestrador da Saga (OS Service)
  Eu quero que o Billing Service gere orçamentos e processe pagamentos
  Para que a ordem de serviço avance para execução somente após o pagamento confirmado

  Scenario: Cliente aprova o orçamento e o pagamento é confirmado
    Given uma ordem de serviço "77" foi criada com valor total de 450.00
    When o Billing Service recebe o evento OS_CREATED
    Then um orçamento pendente é criado para a ordem de serviço "77"
    When o cliente aprova o orçamento da ordem de serviço "77"
    Then o orçamento é marcado como aprovado
    And uma cobrança é criada no Mercado Pago
    When o Mercado Pago confirma o pagamento
    Then o pagamento é marcado como confirmado
    And o evento PAYMENT_CONFIRMED é publicado para a ordem de serviço "77"

  Scenario: Cliente rejeita o orçamento
    Given uma ordem de serviço "78" foi criada com valor total de 200.00
    When o Billing Service recebe o evento OS_CREATED
    Then um orçamento pendente é criado para a ordem de serviço "78"
    When o cliente rejeita o orçamento da ordem de serviço "78"
    Then o orçamento é marcado como anulado
    And nenhuma cobrança é criada no Mercado Pago
