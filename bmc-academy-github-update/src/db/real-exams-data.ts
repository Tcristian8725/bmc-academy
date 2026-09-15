/**
 * Conteúdo REAL de provas de Entrega Técnica, extraído dos documentos que o
 * Telles compartilhou no SharePoint (pasta "provas"). Fonte: arquivos
 * "Prova_EntregaTecnica_*.docx".
 *
 * IMPORTANTE — GABARITO PENDENTE: ao ler os documentos de gabarito
 * remotamente, o texto vem idêntico ao da prova (a marcação da resposta
 * certa — negrito/grifo no Word — não sobrevive à extração de texto).
 * Por decisão do Telles (15/09/2026), as perguntas e alternativas REAIS
 * foram importadas agora, mas NENHUMA alternativa está marcada como
 * correta ainda ("correct: false" em todas). Os treinamentos abaixo ficam
 * como RASCUNHO (published: false) até o Telles confirmar o gabarito de
 * cada prova — só então um admin marca as respostas certas pela tela
 * Admin > Treinamentos e publica.
 */

export type RawQuestion = {
  statement: string;
  answers: string[]; // texto das alternativas, na ordem a/b/c/d — nenhuma marcada como correta ainda
};

export type RawExam = {
  equipmentFamily: string;
  equipmentModel: string;
  trainingCode: string;
  trainingTitle: string;
  sourceVideo: string;
  questions: RawQuestion[];
};

export const REAL_EXAMS: RawExam[] = [
  {
    equipmentFamily: "Retroescavadeiras",
    equipmentModel: "HB640C",
    trainingCode: "ENTREGA-HB640C",
    trainingTitle: "Entrega Técnica — Retroescavadeira HB640C",
    sourceVideo: "Entrega Técnica Retroescavadeira HB640C — BMC Hyundai",
    questions: [
      { statement: "Esse reservatório, mostrado no vídeo, é usado para verificar:", answers: ["O nível de combustível", "O nível do óleo da transmissão", "O nível do fluido de freio", "O nível do líquido de arrefecimento"] },
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["O reservatório de água", "O tanque de diesel (bocal de abastecimento)", "O filtro de ar", "O reservatório hidráulico"] },
      { statement: "Esse reservatório, mostrado no vídeo, é usado para verificar:", answers: ["O nível de combustível", "O nível do óleo do motor", "O nível do fluido de freio", "O nível de arla"] },
      { statement: "Esse reservatório, mostrado no vídeo, contém:", answers: ["O fluido de freio", "O óleo hidráulico", "O combustível diesel", "A água do limpador de para-brisa"] },
      { statement: "Essa região, mostrada no vídeo, é usada para verificar:", answers: ["O nível do óleo da transmissão", "O nível do óleo do motor", "A pressão dos pneus", "O nível do líquido de arrefecimento"] },
      { statement: "Esse comando, na cabine, aciona:", answers: ["O acelerador da máquina", "A trava do cilindro de elevação", "O freio de estacionamento", "O limpador de para-brisa"] },
      { statement: "Essa trava, mostrada no vídeo, tem qual função?", answers: ["Travar a porta da cabine", "Travar a segurança do cilindro de elevação", "Travar o câmbio", "Travar o freio de estacionamento"] },
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["O interruptor do rádio", "O botão de partida a frio", "O interruptor do limpador", "A chave de ignição da retroescavadeira"] },
      { statement: "Essa ação, mostrada no vídeo, é:", answers: ["A abertura da porta da cabine", "A abertura da janela do escorpião", "A abertura do capô do motor", "A abertura do tanque de combustível"] },
      { statement: "Essa foto, mostrada no vídeo, refere-se à:", answers: ["Abertura e trava da janela do escorpião", "Abertura do capô", "Abertura da porta da cabine", "Abertura do tanque de diesel"] },
      { statement: "Esse comando, no banco do operador, é usado para:", answers: ["Acionar o freio de estacionamento", "Ajustar a inclinação do encosto do banco", "Ligar o motor", "Acionar o escorpião"] },
      { statement: "Esse painel, na cabine, controla:", answers: ["O ventilador e o ar-condicionado", "O rádio", "As luzes de trabalho", "O nível de combustível"] },
      { statement: "Esse pedal, mostrado no vídeo, é:", answers: ["O freio de serviço", "O acelerador da máquina", "O pedal do escorpião", "O pedal de embreagem"] },
      { statement: "Esse painel de instrumentos, mostrado no vídeo, é usado, entre outras coisas, para:", answers: ["Ajustar o rádio", "Controlar a temperatura da cabine", "Aumentar a rotação do motor", "Travar o câmbio"] },
      { statement: "Qual é a função da alavanca de acionamento do câmbio (frente/ré/neutra), mostrada no vídeo?", answers: ["Acionar o escorpião", "Selecionar o sentido de deslocamento da máquina (avante, ré ou neutro)", "Travar o cilindro de elevação", "Ajustar a rotação do motor"] },
      { statement: "No vídeo, o que é mostrado sobre os freios dianteiros e traseiros da retroescavadeira?", answers: ["Eles não podem ser acionados juntos em nenhuma situação", "Apenas o freio traseiro funciona", "Existe um sistema de trava que permite acioná-los em conjunto", "Eles substituem o freio de estacionamento"] },
      { statement: "Qual é a função do sistema de escamoteamento da coluna de direção, mostrado no vídeo?", answers: ["Permitir inclinar/recolher a coluna de direção para facilitar entrada e saída do operador", "Travar o volante permanentemente", "Aumentar a velocidade máxima da máquina", "Substituir o freio de estacionamento"] },
      { statement: "Qual é a função da alavanca de movimentação do escorpião (braço traseiro), mostrada no vídeo?", answers: ["Acionar o freio de estacionamento", "Ajustar o banco do operador", "Movimentar o escorpião e abrir/fechar o braço e a caçamba traseira", "Ligar o ar-condicionado"] },
      { statement: "O que a caixa de ferramentas da máquina, mostrada no vídeo, contém?", answers: ["Apenas o extintor de incêndio", "Somente peças de reposição do motor", "O carregador de bateria", "Manual do operador, manual de manutenção do motor Perkins e controle do rádio"] },
      { statement: "Qual é a função da alavanca extra mostrada no vídeo, além do acionamento do H (braço) e caçamba?", answers: ["Acionar implementos por uma via hidráulica adicional", "Acionar exclusivamente o freio de estacionamento", "Substituir o acelerador da máquina", "Ligar o motor"] },
    ],
  },
  {
    equipmentFamily: "Escavadeiras",
    equipmentModel: "HX150 / HX180 / HX220 / HX260",
    trainingCode: "ENTREGA-HX150-HX260",
    trainingTitle: "Entrega Técnica — Escavadeiras HX150 / HX180 / HX220 / HX260",
    sourceVideo: "Entrega Técnica das Máquinas HX150, HX180, HX220 e HX260 — BMC Hyundai",
    questions: [
      { statement: "Esse reservatório, mostrado no vídeo, é usado para verificar:", answers: ["O nível de combustível", "O nível do óleo hidráulico", "O nível do fluido de freio", "O nível do líquido de arrefecimento"] },
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["O painel do ar-condicionado", "A chave geral e a caixa de fusíveis", "O interruptor de emergência", "A bomba hidráulica"] },
      { statement: "Esse componente, mostrado no vídeo, é chamado de:", answers: ["Filtro de ar condicionado", "Filtro de combustível", "Trocadores de calor", "Painel elétrico"] },
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["O bocal de óleo hidráulico", "O bocal de arrefecimento", "O reservatório de óleo do motor", "O bocal de abastecimento de combustível"] },
      { statement: "Esses componentes, mostrados no vídeo, são chamados de:", answers: ["Roletes inferiores", "Roletes superiores", "Redutores de giro", "Esticadores de esteira"] },
      { statement: "Essa região do teto da cabine abriga:", answers: ["O alto-falante", "A luz de emergência", "As antenas de rádio e do HIMATE (telemetria Hyundai)", "O sensor de chuva"] },
      { statement: "Esse componente, mostrado no vídeo, é usado para:", answers: ["Lubrificar a coroa de giro", "Esticar a esteira", "Filtrar o ar do motor", "Resfriar o óleo hidráulico"] },
      { statement: "Esse componente vermelho, mostrado no vídeo, é:", answers: ["O motor de partida", "O compressor do ar-condicionado", "A bomba de combustível", "A nova bomba hidráulica da linha HX"] },
      { statement: "Esse componente, mostrado no vídeo, tem qual função?", answers: ["Filtrar o óleo hidráulico", "Vedar o tanque de combustível", "Anel protetor de poeira (proteger a graxa da coroa de giro)", "Proteger a bateria"] },
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["A câmera de ré", "O sensor de chuva", "A antena do HIMATE", "O farol de trabalho traseiro"] },
      { statement: "Nessa região da máquina está localizada:", answers: ["A caixa de fusíveis", "A plaqueta com dados de fabricação e número de série", "O ponto de lubrificação da coroa de giro", "A válvula de alívio hidráulico"] },
      { statement: "Esse interruptor, mostrado no vídeo, é:", answers: ["O interruptor de desligamento de emergência", "O interruptor de potência máxima", "O interruptor da buzina", "O interruptor do limpador"] },
      { statement: "Esse conjunto, na cabine, é composto por:", answers: ["Rádio e alto-falantes", "Tomada de energia de 24V, martelo de segurança e porta-objetos", "Painel de fusíveis e chave geral", "Controlador do ar-condicionado"] },
      { statement: "Esse painel digital, mostrado no vídeo, é:", answers: ["O rádio digital", "O sistema de telemetria HIMATE", "O novo painel (cluster) da máquina", "O controlador do ar-condicionado"] },
      { statement: "Qual é a função da alavanca de liberação de operação, mostrada no início do vídeo?", answers: ["Acionar o freio de estacionamento", "Bloquear/liberar a operação dos comandos hidráulicos da máquina (função de segurança)", "Abrir o capô do motor", "Ligar o ar-condicionado"] },
      { statement: "Segundo o vídeo, o motor de tração possui quais pontos de verificação?", answers: ["Apenas o bujão de dreno", "Somente o ponto de lubrificação", "Bujão de enchimento, bujão de verificação de nível e bujão de dreno", "Apenas o filtro de óleo"] },
      { statement: "Qual é a finalidade do alojamento dos filtros de ar do motor, interno e externo, mostrado no vídeo?", answers: ["Filtrar o ar admitido pelo motor em dois estágios", "Filtrar o combustível antes da injeção", "Resfriar o óleo hidráulico", "Filtrar o ar da cabine"] },
      { statement: "Qual é a função do sistema de trava da porta de acesso ao motor, mostrado no vídeo?", answers: ["Impedir a abertura do capô permanentemente", "Substituir o freio de estacionamento", "Manter a porta fixa e segura, evitando que se mova sozinha durante a manutenção", "Vedar o compartimento contra água"] },
      { statement: "Qual é a finalidade da porta de conexão da ferramenta de diagnóstico HCEDT, mostrada no vídeo?", answers: ["Carregar o celular do operador", "Conectar caixas de som externas", "Ligar luzes de trabalho adicionais", "Permitir a leitura de parâmetros e diagnóstico eletrônico da máquina"] },
      { statement: "Qual é a função do controlador digital do ar-condicionado e do sistema de ventilação da cabine, mostrado no vídeo?", answers: ["Ajustar temperatura, velocidade do ventilador e direção do fluxo de ar", "Ajustar a rotação do motor", "Controlar a pressão do sistema hidráulico", "Configurar o painel de instrumentos"] },
      { statement: "Qual é a finalidade da tabela de instrução de manutenção do equipamento, mostrada no vídeo?", answers: ["Substituir o manual do operador completo", "Indicar apenas o número de série", "Servir de adesivo de propaganda do fabricante", "Orientar sobre os pontos e intervalos de manutenção da máquina"] },
    ],
  },
  {
    equipmentFamily: "Escavadeiras",
    equipmentModel: "HX400L",
    trainingCode: "ENTREGA-HX400L",
    trainingTitle: "Entrega Técnica — Escavadeira HX400L (nível técnico)",
    sourceVideo: "Entrega Técnica da HX400L — BMC Hyundai / Manual do Operador HX400L (91KA-30240BR)",
    questions: [
      { statement: "Esse componente, ao ser acionado, provoca qual efeito imediato na máquina?", answers: ["Reduz apenas a rotação do motor para marcha lenta", "Liga o sistema de ar-condicionado", "Ativa o modo econômico de trabalho", "Corta a alimentação, desligando o equipamento em situação de risco"] },
      { statement: "Esse reservatório abastece qual sistema da máquina?", answers: ["Sistema hidráulico principal", "Sistema do limpador de para-brisa (fluido de limpeza)", "Sistema de arrefecimento do motor", "Sistema de pós-tratamento (ARLA 32)"] },
      { statement: "Qual é a função técnica desse componente no circuito de arrefecimento?", answers: ["Filtrar partículas do óleo hidráulico", "Armazenar energia elétrica reserva", "Trocar calor entre o fluido (água/óleo) e o ar ambiente, dissipando o calor gerado pelo motor e sistema hidráulico", "Amplificar o sinal do sensor de temperatura"] },
      { statement: "Além do número de série, que outra informação técnica consta nessa plaqueta e é usada para comprar peças/serviços corretos?", answers: ["Código do posto de combustível autorizado", "Senha de acesso ao cluster", "Número do chassi do caminhão transportador", "Modelo/tipo da máquina, potência do motor e massa operacional"] },
      { statement: "Qual é a consequência técnica de não repor esse anel quando ele cai ou se danifica?", answers: ["Aumento do consumo de combustível em até 50%", "Entrada de sujeira/água nos pinos de fixação, comprometendo a lubrificação e acelerando o desgaste", "Perda de sinal do GPS/telemetria", "Redução da pressão dos pneus"] },
      { statement: "Ao usar esse ponto para içar a cabine (ex: manutenção ou substituição), qual cuidado técnico é essencial?", answers: ["Içar sempre pela lança, nunca pelo ponto indicado", "Não é necessário nenhum cuidado especial", "Usar equipamento com capacidade adequada e cintas/correntes fixadas exatamente nos pontos indicados pelo fabricante", "Usar apenas cordas de nylon comuns"] },
      { statement: "Esse bocal de enchimento deve ser usado com qual tipo de óleo, e em qual condição do motor?", answers: ["Óleo hidráulico, com o motor em funcionamento", "Óleo do motor especificado no manual, com o motor desligado e frio/estabilizado", "Combustível diesel, com o motor ligado", "Fluido de arrefecimento, em qualquer temperatura"] },
      { statement: "Qual a recomendação de manutenção periódica para esse componente, segundo o manual?", answers: ["Deve ser removido permanentemente após a primeira revisão", "Não requer manutenção durante toda a vida da máquina", "Deve ser substituído apenas quando a máquina for revendida", "Inspeção, limpeza e troca periódica para manter a eficiência do sistema e prolongar sua vida útil"] },
      { statement: "Esse interruptor de potência máxima, quando acionado na alavanca RCV, opera por qual tempo máximo?", answers: ["Até 60 segundos", "Tempo indefinido, até ser desligado manualmente", "Até 8 segundos", "Apenas 1 segundo"] },
      { statement: "As tampas de acesso à parte inferior do equipamento, mostradas no início do vídeo, dão acesso a um conjunto de 4 filtros. Quais são eles?", answers: ["Filtro separador de água e óleo diesel, filtro de óleo diesel, filtro do líquido de arrefecimento e filtro de óleo do motor", "Filtro de ar da cabine, filtro de ar do motor, filtro de combustível e filtro hidráulico de retorno", "Filtro de pólen, filtro de carvão ativado, filtro de partículas e filtro de linha piloto", "Apenas o filtro de óleo do motor, repetido em 4 posições"] },
      { statement: "Tecnicamente, por que o alojamento dos filtros de ar, baterias e bloco piloto fica concentrado num único compartimento na estrutura superior?", answers: ["Porque são os únicos componentes sensíveis à vibração", "Para facilitar a inspeção e manutenção conjunta desses itens, reduzindo tempo de parada da máquina", "Para isolar eletricamente o motor do restante da máquina", "Porque precisam ficar próximos ao tanque de combustível por norma"] },
      { statement: "A chave geral de energia, localizada junto ao alojamento dos filtros/baterias, deve ser desligada em qual sequência/momento correto?", answers: ["Somente depois que a lâmpada do painel apagar (pós-tratamento finalizado), para evitar falha grave no sistema de pós-tratamento", "Imediatamente ao parar a máquina, mesmo com a lâmpada de pós-tratamento acesa", "Antes de desligar a chave de partida", "Não há sequência — pode ser desligada em qualquer momento"] },
      { statement: "Do ponto de vista técnico, qual é a função combinada dos roletes superiores e inferiores no sistema de rodagem?", answers: ["Resfriar o óleo hidráulico do sistema de translação", "Sustentar o peso da máquina sobre a esteira e guiá-la corretamente, garantindo a tração e o deslocamento", "Amortecer vibrações do motor", "Fixar o contrapeso à estrutura inferior"] },
      { statement: "A via adicional hidráulica mostrada no vídeo — usada para rompedor e pontos de lubrificação — está tecnicamente ligada a qual sistema?", answers: ["Circuito de arrefecimento do motor", "Circuito elétrico de 24V da cabine", "Circuito hidráulico auxiliar/opcional, independente do circuito principal de trabalho (lança/braço/caçamba)", "Sistema de ar-condicionado"] },
      { statement: "Qual é a função de segurança específica da alavanca de liberação de operação, dentro da cabine?", answers: ["Aciona o freio de estacionamento das esteiras", "Quando travada, bloqueia hidraulicamente os comandos das alavancas RCV, impedindo movimentos acidentais do implemento", "Desliga o motor em caso de sobreaquecimento", "Liga o modo de potência máxima"] },
      { statement: "Ao verificar o nível de óleo do motor pela vareta, qual é o procedimento técnico correto?", answers: ["Motor em funcionamento e em rampa, para simular carga real", "Apenas visualmente, sem remover a vareta", "Motor frio/parado e máquina em terreno nivelado, comparando o nível com as marcações MIN/MAX da vareta", "Motor quente, imediatamente após desligar, sem esperar decantação do óleo"] },
      { statement: "No reservatório do líquido de arrefecimento mostrado no vídeo, o que a faixa de nível (MIN/MAX) representa tecnicamente?", answers: ["A margem de expansão do fluido com a variação de temperatura, evitando falta de arrefecimento ou transbordamento", "Apenas uma referência estética do fabricante", "O nível de troca de óleo do motor", "A pressão interna do sistema de arrefecimento"] },
      { statement: "A porta de conexão da ferramenta de diagnóstico HCEDT permite tecnicamente qual tipo de intervenção?", answers: ["Apenas carregar o celular do operador", "Conectar caixas de som externas", "Leitura de parâmetros do sistema eletrônico (MCU/ECM), diagnóstico de falhas e calibração de componentes", "Ligar luzes de trabalho adicionais"] },
      { statement: "Do ponto de vista ergonômico e de segurança, por que existe um compartimento guarda-objetos específico atrás do banco?", answers: ["Porque é obrigatório por lei guardar o manual do operador lá", "Para armazenar peças de reposição do motor", "Não tem função técnica, é apenas estético", "Para evitar que objetos soltos na cabine interfiram nos comandos ou se tornem projéteis em movimentos bruscos"] },
      { statement: "O martelo de segurança, posicionado junto à tomada de 24V, tem qual finalidade técnica?", answers: ["Quebrar o vidro da cabine para uso como saída alternativa em caso de emergência", "Servir de ferramenta padrão para manutenção do motor", "Fixar componentes elétricos soltos", "Substituir a chave de roda em caso de pneu furado"] },
      { statement: "Tecnicamente, qual a vantagem/limitação de um horímetro analógico (como o mostrado no vídeo) em relação a um digital?", answers: ["É mais preciso que qualquer sistema digital", "Não sofre desgaste mecânico ao longo do tempo", "Substitui completamente a necessidade do sistema de telemetria Himate", "É mecânico e mais simples, mas não permite registro de dados históricos ou diagnósticos remotos como um digital integrado ao sistema eletrônico"] },
    ],
  },
  {
    equipmentFamily: "Motoniveladoras",
    equipmentModel: "HG170-3",
    trainingCode: "ENTREGA-HG170",
    trainingTitle: "Entrega Técnica — Motoniveladora HG170-3",
    sourceVideo: "Entrega Técnica Motoniveladora HG170-3 — BMC Hyundai",
    questions: [
      { statement: "Esse implemento, montado na frente da máquina, é chamado de:", answers: ["Lâmina niveladora", "Contrapeso", "Rolo compactador", "Escarificador (ripper)"] },
      { statement: "Esse cilindro hidráulico cromado, mostrado no vídeo, é usado para:", answers: ["Levantar/abaixar a lâmina (moldboard)", "Esterçar o equipamento", "Esticar a esteira", "Acionar o freio de estacionamento"] },
      { statement: "Esses pedais, mostrados no vídeo, são usados para:", answers: ["Acionar a lâmina", "Ajustar o banco", "Acelerar e frear a máquina", "Acionar o escarificador"] },
      { statement: "Essa alavanca, com o padrão de marchas numerado, é usada para:", answers: ["Acionar o freio de estacionamento", "Ligar o motor", "Acionar os faróis de trabalho", "Selecionar a marcha da transmissão"] },
      { statement: "Essa tela, instalada na cabine, mostra:", answers: ["O nível de combustível", "A imagem da câmera de ré", "O manual do operador", "A temperatura do motor"] },
      { statement: "Esse equipamento, instalado no teto da cabine, é:", answers: ["O sensor de chuva", "O alarme de ré", "Um ventilador para circulação de ar", "O sistema de som"] },
      { statement: "Esse equipamento, instalado no teto da cabine, é:", answers: ["O horímetro digital", "O rádio da máquina", "O painel de fusíveis", "O sistema de telemetria"] },
      { statement: "Esse interruptor (triângulo) aciona:", answers: ["O freio de estacionamento", "O limpador de para-brisa", "A buzina", "O pisca-alerta (luzes de emergência)"] },
      { statement: "Esse interruptor aciona:", answers: ["O ar-condicionado", "O rádio", "O farol alto", "O modo econômico"] },
      { statement: "Esse interruptor (farol com feixe de luz) aciona:", answers: ["Um farol de trabalho", "O pisca-alerta", "O limpador de para-brisa", "A buzina"] },
      { statement: "Esse interruptor, semelhante ao anterior, aciona:", answers: ["O freio de estacionamento", "Outro farol de trabalho (em posição diferente)", "O ar-condicionado", "A luz interna da cabine"] },
      { statement: "Qual é a função do escarificador (ripper), mostrado no início do vídeo?", answers: ["Soltar/romper solos compactados antes do nivelamento com a lâmina", "Compactar o solo", "Transportar material", "Nivelar o asfalto"] },
      { statement: "Por que é importante verificar o cilindro hidráulico de elevação da lâmina na entrega técnica?", answers: ["Porque ele controla a velocidade do motor", "Para garantir que a lâmina sobe/desce corretamente e não há vazamento de óleo", "Porque ele substitui o freio de estacionamento", "Porque ele aciona o ar-condicionado"] },
      { statement: "Qual é a finalidade da câmera de ré exibida no monitor da cabine?", answers: ["Gravar a operação para relatório de manutenção", "Substituir o espelho retrovisor externo permanentemente", "Ajudar o operador a visualizar a área traseira da máquina ao dar marcha à ré", "Medir a distância percorrida"] },
    ],
  },
  {
    equipmentFamily: "Pá Carregadeiras",
    equipmentModel: "HL745-9",
    trainingCode: "ENTREGA-HL745",
    trainingTitle: "Entrega Técnica — Pá Carregadeira HL745-9",
    sourceVideo: "Entrega Técnica Pá Carregadeira HL745-9 — BMC Hyundai",
    questions: [
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["O farol de trabalho traseiro", "O pisca-alerta", "O sensor de ré", "O farol dianteiro"] },
      { statement: "Esse componente do motor, mostrado no vídeo, é:", answers: ["O alternador", "O turbocompressor", "A bomba de água", "O motor de partida"] },
      { statement: "Esse conjunto, mostrado no vídeo, é usado para:", answers: ["Filtrar o ar de admissão", "Aquecer a cabine", "Resfriar o motor (radiador + ventilador hidráulico)", "Amplificar o som do motor"] },
      { statement: "Esse componente, no compartimento do motor, é:", answers: ["O motor de partida", "A bomba de direção", "O alternador", "O compressor do ar-condicionado"] },
      { statement: "Essa alavanca vermelha, na cabine, aciona:", answers: ["O modo de potência máxima", "O travamento do sistema hidráulico", "O limpador de para-brisa", "A buzina"] },
      { statement: "Esse comando, na coluna de direção, controla:", answers: ["As setas de direção", "As luzes de trabalho", "O limpador e o lavador do para-brisa", "O ar-condicionado"] },
      { statement: "Esse monitor digital, mostrado no vídeo, exibe entre outras informações:", answers: ["Apenas a hora do dia", "Horímetro, rotação do motor, modo de operação e temperaturas", "O manual do operador", "A imagem da câmera de ré"] },
      { statement: "No monitor digital da máquina, o menu \"GESTÃO\" permite, entre outras coisas, acessar:", answers: ["Apenas o relógio", "O manual do operador em PDF", "O histórico de combustível dos últimos 5 anos", "Referência da máquina e contato de serviço"] },
      { statement: "O menu \"MONITORIZAÇÃO\" do painel digital é usado para:", answers: ["Trocar o idioma do display", "Ajustar a câmera traseira", "Consultar códigos de erro e dados de monitoramento da máquina", "Configurar o rádio"] },
      { statement: "O menu \"AJUSTE DISPLAY\" permite ao técnico/operador:", answers: ["Ajustar hora, unidade de medida, câmera traseira e idioma", "Trocar o óleo do motor remotamente", "Recalibrar o motor", "Resetar a garantia da máquina"] },
      { statement: "Por que é importante testar o cinto de segurança durante a entrega técnica?", answers: ["Porque ele aciona o motor", "Para garantir que ele trava e destrava corretamente, protegendo o operador", "Porque ele substitui o freio de estacionamento", "Porque ele liga o ar-condicionado"] },
      { statement: "Qual é a função do turbocompressor no motor da máquina?", answers: ["Aumentar a quantidade de ar admitido, elevando a potência do motor", "Resfriar o óleo hidráulico", "Filtrar a água do sistema de arrefecimento", "Reduzir o consumo de combustível pela metade"] },
      { statement: "Qual é a finalidade prática de o painel mostrar o modo de potência (ex: STD/POWER) do motor?", answers: ["Indicar apenas a hora certa", "Permitir ao operador ajustar o desempenho da máquina conforme a necessidade do trabalho", "Substituir a necessidade de troca de óleo", "Trocar a marcha automaticamente sem o operador saber"] },
    ],
  },
  {
    equipmentFamily: "Mini Escavadeiras",
    equipmentModel: "HX60S",
    trainingCode: "ENTREGA-HX60S",
    trainingTitle: "Entrega Técnica — Mini Escavadeira HX60S",
    sourceVideo: "Entrega Técnica Mini Escavadeira HX60S — BMC Hyundai",
    questions: [
      { statement: "Esse implemento, mostrado no vídeo, é chamado de:", answers: ["Lâmina niveladora", "Escarificador", "Garfo paletizador", "Caçamba"] },
      { statement: "Esse componente, mostrado no vídeo, é:", answers: ["O contrapeso", "A lança/braço da escavadeira", "O cilindro de direção", "A esteira"] },
      { statement: "Esse implemento, na frente da máquina, é chamado de:", answers: ["Caçamba", "Escarificador", "Lâmina niveladora (blade)", "Rolo compactador"] },
      { statement: "Esse componente, mostrado no vídeo, é chamado de:", answers: ["Roletes superiores apenas", "Coroa de giro", "Redutor final", "Esteira (trem de rodagem)"] },
      { statement: "Esse componente, no compartimento do motor, é:", answers: ["O motor de partida", "A bomba hidráulica e o motor diesel", "O alternador", "O compressor do ar-condicionado"] },
      { statement: "Esse reservatório branco, mostrado no vídeo, contém:", answers: ["O óleo hidráulico", "O combustível diesel", "A água do limpador de para-brisa", "O fluido de freio"] },
      { statement: "Esse painel de interruptores, na cabine, é usado para acionar:", answers: ["O sistema hidráulico principal", "Funções elétricas auxiliares (luzes, limpador, etc.)", "A partida do motor", "O sistema de freios"] },
      { statement: "Essa alavanca (joystick), junto ao painel digital, é usada para:", answers: ["Acionar o freio de estacionamento", "Ligar o ar-condicionado", "Selecionar o idioma do painel", "Controlar as funções hidráulicas do implemento (lança e caçamba)"] },
      { statement: "No painel digital da máquina, mostrado no vídeo, o que o indicador \"RPM do motor\" exibe?", answers: ["A velocidade de deslocamento da máquina", "O nível de combustível", "A rotação do motor", "As horas de trabalho acumuladas"] },
      { statement: "Ainda sobre o painel digital, o que é exibido no campo \"Horas de trabalho\"?", answers: ["O horímetro acumulado de uso da máquina", "A hora atual do dia (relógio)", "O tempo restante de combustível", "O tempo de garantia restante"] },
      { statement: "O painel digital do HX60S exibe, entre outras informações:", answers: ["Apenas a hora do dia", "Temperatura do líquido de arrefecimento e temperatura do óleo hidráulico", "Somente o nível de combustível", "Apenas o horímetro"] },
      { statement: "Qual é a função do \"Botão ESC\" no painel digital, mostrado no vídeo?", answers: ["Sair/voltar de uma tela ou menu do painel", "Aumentar a rotação do motor", "Acionar o freio de estacionamento", "Ligar os faróis de trabalho"] },
      { statement: "Qual é a função do \"Botão de parada de avisos sonoros\" no painel digital?", answers: ["Desligar o motor", "Silenciar o alarme sonoro de advertência", "Aumentar o volume do rádio", "Travar o painel"] },
      { statement: "No menu do painel digital (Diagnosis / Settings / Display), a opção \"Settings\" permite:", answers: ["Executar diagnóstico de falhas do motor", "Trocar o óleo remotamente", "Ajustar configurações do painel", "Acessar a câmera de ré"] },
      { statement: "No mesmo menu, a opção \"Diagnosis\" é usada para:", answers: ["Ajustar o brilho da tela", "Consultar códigos de diagnóstico/falha da máquina", "Trocar o idioma do painel", "Configurar o relógio"] },
      { statement: "E a opção \"Display\" desse menu permite:", answers: ["Reiniciar o motor", "Calibrar os sensores do motor", "Ajustar configurações de exibição do painel (tela)", "Acessar o manual do operador"] },
    ],
  },
  {
    equipmentFamily: "Empilhadeiras",
    equipmentModel: "Empilhadeira 25/35D",
    trainingCode: "ENTREGA-EMPILHADEIRA-2535D",
    trainingTitle: "Entrega Técnica — Empilhadeira 25/35D",
    sourceVideo: "Entrega Técnica Empilhadeiras 25/35D-E — BMC Hyundai",
    questions: [
      { statement: "O que é mostrado nessa foto (bloco/cilindro na base do garfo)?", answers: ["Motor de partida", "Filtro de combustível", "Cilindro de direção", "Válvula/cilindro do posicionador hidráulico dos garfos"] },
      { statement: "Além do modelo da máquina, o que mais é possível identificar nessa vista frontal?", answers: ["O painel elétrico", "O conjunto mastro/garfos e o pneu dianteiro", "O tanque de arla", "O sistema de ar-condicionado"] },
      { statement: "Esse componente, com a placa de identificação de posições, serve para:", answers: ["Acionar o freio de estacionamento", "Ligar o motor", "Selecionar o sentido de marcha (avante/neutro/ré) da transmissão", "Acionar o guincho"] },
      { statement: "O que é o acessório redondo instalado no volante?", answers: ["Sensor de velocidade", "Buzina auxiliar", "Trava de direção", "Manopla (spinner knob) para facilitar giros rápidos do volante"] },
      { statement: "Essa plaqueta, fixada na estrutura da máquina, contém:", answers: ["Instruções de lubrificação", "Dados de fabricação, modelo e número de série da máquina", "Código de acesso ao painel", "Tabela de pressão dos pneus"] },
      { statement: "Esse conjunto de alavancas (com punhos amarelos) controla:", answers: ["A velocidade do motor", "O sistema de som", "As funções hidráulicas do implemento (elevação, inclinação e funções auxiliares)", "O nível de combustível"] },
      { statement: "Nessa região (pedais), normalmente encontramos:", answers: ["Pedal de embreagem apenas", "Pedal do acelerador e pedal de freio", "Pedal do para-brisa", "Pedal do guincho"] },
      { statement: "O compartimento mostrado nessa foto, com o capô aberto, dá acesso a:", answers: ["Ao tanque de água do limpador de para-brisa", "À bateria auxiliar apenas", "Ao compartimento de ferramentas", "Ao motor (compartimento do motor)"] },
      { statement: "Qual é a função técnica do posicionador hidráulico de garfos, mostrado no início do vídeo?", answers: ["Aumentar a capacidade de carga da máquina", "Resfriar o óleo hidráulico", "Permitir o ajuste do afastamento entre os garfos sem a necessidade de esforço manual", "Substituir o freio de estacionamento"] },
      { statement: "Qual é a finalidade da plaqueta de identificação fixada na estrutura da empilhadeira?", answers: ["Fornecer dados de fabricação (modelo, capacidade, número de série) usados para identificar a máquina e pedir peças/serviços corretos", "Indicar a data da última troca de óleo", "Servir de adesivo de propaganda do fabricante", "Autorizar o operador a dirigir a máquina"] },
      { statement: "Sobre a alavanca joystick de comando hidráulico: por que é importante o técnico testar o curso completo dela na entrega técnica?", answers: ["Porque ela também liga e desliga o motor", "Para confirmar que os movimentos de elevação/inclinação respondem corretamente e sem vazamentos ou folgas", "Porque ela substitui o pedal de freio", "Porque ela controla a pressão dos pneus"] },
    ],
  },
  {
    equipmentFamily: "Empilhadeiras",
    equipmentModel: "Empilhadeira 160D/250D",
    trainingCode: "ENTREGA-EMPILHADEIRA-160D250D",
    trainingTitle: "Entrega Técnica — Empilhadeira 160D/250D",
    sourceVideo: "Entrega Técnica Empilhadeira 160D/250D — BMC Hyundai",
    questions: [
      { statement: "Essa grade, localizada na traseira da máquina, tem qual função principal?", answers: ["Filtrar o ar-condicionado da cabine", "Servir de suporte para o extintor", "Proteger a bateria", "Proteger o radiador/motor e permitir ventilação, além de servir de contrapeso"] },
      { statement: "Esse compartimento lateral, mostrado aberto no vídeo, abriga:", answers: ["O reservatório de arla", "A bateria e itens de armazenamento da máquina", "O motor de partida isolado", "O sistema de ar-condicionado"] },
      { statement: "Essa plaqueta, fixada no painel dentro da cabine, contém:", answers: ["Instruções de lubrificação do mastro", "Código de acesso ao painel eletrônico", "Dados de fabricação, modelo e número de série da máquina", "Tabela de pressão dos pneus"] },
      { statement: "Esse conjunto de comandos, no painel central, controla:", answers: ["A rotação do motor", "O sistema de som", "O nível de combustível", "Temperatura, velocidade e direção do fluxo de ar do sistema de climatização"] },
      { statement: "Esse conjunto de interruptores, próximo à alavanca de câmbio, é usado para acionar:", answers: ["O sistema hidráulico principal", "Funções específicas como freio de estacionamento e modo de transmissão", "A partida do motor", "O limpador de para-brisa"] },
      { statement: "Esse conjunto de instrumentos, mostrado no vídeo, é chamado de:", answers: ["Console de fusíveis", "Módulo de injeção eletrônica", "Cluster (painel de instrumentos)", "Quadro de distribuição elétrica"] },
      { statement: "Esse interruptor, com o símbolo \"(P)\", aciona:", answers: ["O modo de potência máxima", "O freio de estacionamento", "O limpador de para-brisa", "A buzina"] },
      { statement: "Esse interruptor, com a engrenagem e a letra \"A\", serve para:", answers: ["Ativar o modo 4x4", "Ligar o ar-condicionado", "Acionar o guincho", "Selecionar o modo automático da transmissão"] },
      { statement: "Esse interruptor (ícone de floco de neve) aciona:", answers: ["O aquecedor do banco", "O limpador do para-brisa traseiro", "O sistema de ar-condicionado", "O modo econômico do motor"] },
      { statement: "Esse interruptor (ícone de sol/estrela) aciona:", answers: ["A luz de trabalho/farol adicional", "O ar-condicionado", "O pisca-alerta", "O rádio"] },
      { statement: "Esses ícones (seta + farol) indicam, respectivamente:", answers: ["Nível de combustível e temperatura do motor", "Luz piloto da seta (direção) e luz piloto do farol alto", "Freio de mão e carga da bateria", "Filtro de ar e pressão do óleo"] },
      { statement: "Esse ícone (círculo com ondas), no painel, indica:", answers: ["Luz piloto do freio de mão (freio de estacionamento acionado)", "Luz de alerta do filtro de ar", "Luz piloto do farol de trabalho", "Luz de alerta de baixo nível de combustível"] },
      { statement: "Esse ícone, no painel, indica:", answers: ["Luz de alerta de erro de T/M (transmissão)", "Luz de alerta de carga da bateria", "Luz piloto do OPSS", "Luz de alerta da presença de água no combustível"] },
      { statement: "Esse medidor, no painel, indica:", answers: ["Temperatura do óleo da transmissão (T/M)", "Velocidade da máquina", "Nível de combustível (E = vazio, F = cheio)", "Pressão do óleo do motor"] },
      { statement: "Esses dois medidores (C...H), no painel, indicam:", answers: ["Nível de combustível e nível de óleo hidráulico", "Temperatura do óleo de T/M e temperatura do fluido refrigerante do motor", "Velocidade do motor (RPM) e velocidade da máquina", "Carga da bateria e pressão dos pneus"] },
      { statement: "No display (LCD) do painel, mostrado no vídeo, qual botão é usado para confirmar/entrar em uma opção do menu?", answers: ["Botão de câmera/SAIR", "Botão de LIGA", "Botão de \"Entrar\"", "Botão seletor esquerdo"] },
      { statement: "Ainda sobre o display, os botões seletores esquerdo e direito servem para:", answers: ["Navegar entre as opções do menu do display", "Ligar e desligar o motor", "Ajustar o volume do rádio", "Acionar a buzina"] },
      { statement: "Qual é a função do menu \"CAMERA\", mostrado no display do painel?", answers: ["Tirar fotos para o relatório de manutenção", "Gravar vídeo da operação", "Permitir visualizar a imagem da câmera de ré/lateral da máquina", "Fazer videochamada com o suporte técnico"] },
      { statement: "Qual é a função do interruptor/seletor com as letras \"F-N-R\", mostrado no vídeo?", answers: ["Selecionar o modo de potência do motor", "Ligar os faróis de trabalho", "Ajustar a altura do banco", "Selecionar o sentido de marcha: avante (F), neutro (N) ou ré (R)"] },
    ],
  },
];
