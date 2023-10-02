# Agoge LWC - Tela de Pedidos

## Introdução
A Empresa X contratou a Nèscara para realizar a implantação do seu CRM, sendo a número um de vendas de produtos de bens de consumo a Empresa X tem um fluxo de
retirada de pedido robusto e único, desafiador para todos os desenvolvedores/Funcionais que irão implementar este projeto.

Objetivo: Entregar um MVP baseado nos requisitos de uma tela custom para a criação e edição de pedidos no Salesforce.

#### Cadastro do Pedido:
Objetivo - Cadastro e manutenção de pedidos de venda no Salesforce.

Atributos obrigatórios para os pedidos - Cliente, Endereço de Entrega, Condição de Pagamento, Observação da Nota Fiscal, Catálogo de Preço, Produtos do Pedido.

Cálculos automáticos do pedido - Valor Sugerido: Soma dos preços de lista dos produtos; Valor Total Praticado: Soma dos preços praticados dos produtos.

Regras - Descontos são aplicados diretamente nos produtos, não no pedido; Valor de Pedido Mínimo é R$ 3.000,00, sujeito a alterações trimestrais (O sistema deve lidar com o parâmetro Valor de Pedido Mínimo de forma flexível e alterável, bloqueando pedidos que não atinjam o valor mínimo vigente).

#### Cadastro de Item do Pedido:
Objetivo - Cadastrar produtos nos pedidos de venda.

Atributos obrigatórios para os itens do pedido - Produto, Preço de Lista, Quantidade, Preço Praticado, Desconto, Preço Total do Pedido, Preço Total Praticado do Pedido.

Cálculo automático de % de desconto - Desconto = (1 - (Preço Praticado / Preço Lista)) * 100.

Regras - Preço praticado não pode ser maior que o Preço de Lista, e Quantidade não pode ser zero. Itens que não seguem as regras são bloqueados pelo sistema.

#### Customização do Fluxo de Entrada de Pedidos:
Objetivo - Cadastrar pedidos de forma eficiente e intuitiva.

Fluxo dividido em 3 etapas - Cabeçalho do Pedido, Itens do Pedido e Resumo do Pedido 

Obs: Possui opção de cadastrar observação da nota e salvar o pedido no sistema.

#### Customização do Fluxo de Entrada de Pedidos - Cabeçalho do Pedido:
Objetivo - Customizar o cadastro do cabeçalho do pedido.

Atributos obrigatórios para o cabeçalho do pedido - Cliente (lookup com valor fixo), Endereço do Cliente (Endereço de Entrega) (lookup com endereços da conta), Condição de Pagamento (lookup com opções disponíveis), Catálogo de Preço (lookup com valor fixo).

Regras - A ação "Avançar" só é permitida se todos os atributos obrigatórios estiverem preenchidos; Os dados preenchidos nesta interface devem ser salvos em memória.
 
#### Customização do Fluxo de Entrada de Pedidos - Itens do Pedido:
Objetivo - Customizar o cadastro dos itens do pedido.

Atributos obrigatórios da interface - Filtro de Produtos para restringir a lista de produtos exibidos; Listagem dinâmica de produtos conforme o filtro selecionado.

Funcionalidade - Ao inserir uma Quantidade maior que 0 para um produto, ele é adicionado ao "Carrinho" do Pedido.

Regras - Para avançar, pelo menos um item deve ser adicionado ao Pedido (Os itens já adicionados ao pedido devem ser mantidos em memória).

#### Customização do Fluxo de Entrada de Pedidos - Filtro de Produtos:
Objetivo - Implementar um filtro de produtos na interface de itens dos pedidos.

Atributos obrigatórios do filtro - Capacidade de filtrar a Listagem de Produtos; A barra de pesquisa aceita nome parcial ou completo do produto e código do produto; Inclusão de um botão ao lado da barra de pesquisa para iniciar a busca.

Funcionalidade do Botão - O botão executa a rotina de busca com base no dado inserido na barra de pesquisa.

#### Customização do Fluxo de Entrada de Pedidos - Listagem de Produtos:
Objetivo - Customizar a listagem de produtos em formato de cards.

Atributos obrigatórios do card - Nome do Produto, Preço de Lista do Produto, Desconto (calculado), Preço Total do Pedido (calculado), Preço Total Praticado do Pedido (calculado)

Campos de interação - Quantidade e Preço praticado

Regras - O preço do produto segue o valor estipulado no Catálogo de Preço; Um produto é adicionado ao carrinho quando a Quantidade é maior que zero.

#### Customização do Fluxo de Entrada de Pedidos - Resumo do Pedido:
Objetivo - Customizar a visualização de dados em uma interface de resumo dos dados do pedido.

Atributos obrigatórios da interface - Exibição das informações do cabeçalho do Pedido e da lista de produtos adicionados, Observação da Nota Fiscal (campo de área de texto longo).

Regras - Se a observação da nota fiscal estiver preenchida, ela deve ser mantida em memória; Para salvar, a observação da nota fiscal deve estar preenchida.

#### Customização do Fluxo de Entrada de Pedidos - Salvar o Pedido:
Objetivo - Customizar a funcionalidade de salvar as informações do pedido no Salesforce

Atributos obrigatórios da interface (Feedback) - Em caso de sucesso, o usuário é redirecionado para o registro do Pedido no Salesforce; Em caso de falha, o usuário recebe um popup/modal com as informações do erro, e pode usar os comandos de voltar/avançar para corrigir o problema.

Regras - Salvar as informações do cabeçalho e dos itens do pedido no Salesforce; Alocação dos dados nas tabelas "Order" e "OrderItem".
