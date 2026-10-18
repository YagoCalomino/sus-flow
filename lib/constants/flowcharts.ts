export interface FlowchartConfig {
  id: string
  name: string
  discriminators: string[]
}

export const FLOWCHARTS: FlowchartConfig[] = [
  {
    id: 'dor-no-peito',
    name: 'Dor no Peito',
    discriminators: [
      'Dor irradiando para o braço/mandíbula',
      'Dispneia associada',
      'Diaforese',
      'Dor com início súbito',
      'Histórico cardíaco prévio',
      'Dor em repouso',
    ],
  },
  {
    id: 'cefaleia',
    name: 'Cefaleia',
    discriminators: [
      'Início súbito "em trovoada"',
      'Febre + rigidez de nuca',
      'Alteração do nível de consciência',
      'Dor progressivamente pior',
      'Cefaleia com vômito em jato',
      'Trauma craniano recente',
    ],
  },
  {
    id: 'dificuldade-respiratoria',
    name: 'Dificuldade Respiratória',
    discriminators: [
      'SpO2 < 92%',
      'Uso de musculatura acessória',
      'Estridor',
      'Cianose',
      'Incapaz de falar frases completas',
      'Histórico de asma/DPOC',
    ],
  },
  {
    id: 'dor-abdominal',
    name: 'Dor Abdominal',
    discriminators: [
      'Dor de início súbito e intensidade máxima',
      'Rigidez abdominal (abdômen em tábua)',
      'Sinais de choque (hipotensão, taquicardia)',
      'Dor irradiando para ombro/dorso',
      'Sangramento gastrointestinal associado',
      'Histórico de cirurgia abdominal prévia',
      'Dor progressiva nas últimas 24h',
    ],
  },
  {
    id: 'trauma-em-membro',
    name: 'Trauma em Membro',
    discriminators: [
      'Deformidade visível ou crepitação',
      'Comprometimento vascular (pulso ausente, palidez)',
      'Comprometimento neurológico distal',
      'Trauma de alta energia (queda de altura, acidente de trânsito)',
      'Ferimento aberto com exposição óssea',
      'Incapacidade funcional completa do membro',
    ],
  },
  {
    id: 'febre-alta',
    name: 'Febre Alta',
    discriminators: [
      'Temperatura ≥ 39,5°C',
      'Rigidez de nuca',
      'Petéquias ou rash hemorrágico',
      'Alteração do estado mental',
      'Imunossupressão conhecida',
      'Febre com duração superior a 5 dias',
      'Sinais de sepse (taquicardia + hipotensão)',
    ],
  },
  {
    id: 'dor-lombar',
    name: 'Dor Lombar',
    discriminators: [
      'Déficit neurológico em membros inferiores',
      'Perda de controle vesical ou intestinal',
      'Dor irradiando para membro inferior (ciatalgia)',
      'Trauma recente na coluna',
      'Dor noturna intensa que não melhora em repouso',
      'Febre associada à dor',
    ],
  },
  {
    id: 'alteracao-da-consciencia',
    name: 'Alteração da Consciência',
    discriminators: [
      'Glasgow < 9 (resposta apenas à dor ou sem resposta)',
      'Convulsões associadas',
      'Assimetria pupilar',
      'Trauma cranioencefálico recente',
      'Início súbito',
      'Uso de drogas ou álcool',
      'Histórico de diabetes (suspeita de hipoglicemia)',
    ],
  },
  {
    id: 'vomitos-nauseas',
    name: 'Vômitos / Náuseas',
    discriminators: [
      'Vômitos com sangue (hematêmese)',
      'Sinais de desidratação grave',
      'Vômitos em jato sem náusea prévia',
      'Dor abdominal intensa associada',
      'Alteração do nível de consciência',
      'Vômitos persistentes por mais de 24h',
    ],
  },
  {
    id: 'crise-alergica',
    name: 'Crise Alérgica',
    discriminators: [
      'Dificuldade respiratória ou estridor',
      'Edema de lábios, língua ou glote',
      'Hipotensão ou síncope',
      'Urticária generalizada',
      'Contato recente com alérgeno conhecido',
      'Histórico de anafilaxia prévia',
    ],
  },
  {
    id: 'crise-convulsiva',
    name: 'Crise Convulsiva',
    discriminators: [
      'Primeira crise convulsiva da vida',
      'Crise com duração superior a 5 minutos (estado epiléptico)',
      'Pós-ictal prolongado (> 30 min)',
      'Febre associada em adulto',
      'Trauma craniano após a queda',
      'Epiléptico com mudança no padrão das crises',
    ],
  },
  {
    id: 'dor-garganta-ouvido',
    name: 'Dor em Garganta / Ouvido',
    discriminators: [
      'Dificuldade para engolir ou abrir a boca (trismo)',
      'Estridor ou dificuldade respiratória',
      'Febre alta associada',
      'Edema uvular ou periamigdaliano',
      'Otalgia intensa com perda auditiva súbita',
      'Secreção purulenta no ouvido',
    ],
  },
  {
    id: 'lesao-em-pele',
    name: 'Lesão em Pele',
    discriminators: [
      'Área de queimadura > 10% da superfície corporal',
      'Queimadura em face, mãos, genitais ou articulações',
      'Sinais de infecção (calor, pus, celulite expansiva)',
      'Lesão com comprometimento de estruturas profundas',
      'Rash hemorrágico ou petéquias',
      'Mordedura humana ou animal',
    ],
  },
  {
    id: 'intoxicacao-overdose',
    name: 'Intoxicação / Overdose',
    discriminators: [
      'Alteração do nível de consciência',
      'Depressão respiratória (FR < 12 rpm)',
      'Convulsões',
      'Hipotensão ou bradicardia',
      'Substância com antídoto específico disponível',
      'Ingestão há menos de 1 hora (potencial de lavagem gástrica)',
      'Intenção suicida',
    ],
  },
  {
    id: 'dor-no-olho',
    name: 'Dor no Olho',
    discriminators: [
      'Perda súbita de visão',
      'Trauma ocular (corpo estranho, perfuração)',
      'Olho vermelho com halo ao redor de luzes (suspeita de glaucoma)',
      'Dor intensa com náusea e vômito',
      'Queimadura química ou exposição a agente cáustico',
      'Diplopia (visão dupla) de início agudo',
    ],
  },
]
