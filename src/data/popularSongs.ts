import { Song } from '../types';

export const POPULAR_SONGS: Song[] = [
  {
    id: 'anunciacao-alceu-valenca',
    title: 'Anunciação',
    artist: 'Alceu Valença',
    originalKey: 'G',
    difficulty: 'Fácil',
    genre: 'MPB / Forró',
    timeSignature: '4/4',
    recommendedBpm: 110,
    capo: 0,
    chordsUsed: ['G', 'C', 'Am', 'D7'],
    cifraClubUrl: 'https://www.cifraclub.com.br/alceu-valenca/anunciacao/',
    cifraClubVideoUrl: 'https://www.youtube.com/watch?v=0kGkO4dIs3U',
    toneSuggestions: {
      maleVoice: 'G (Tom Original)',
      femaleVoice: 'C (Transpor +5)',
      noBarreKey: 'G (Sem nenhuma pestana!)',
    },
    chordsText: `[Intro] G  C  G  C
        G  C  Am  D7  G

[Primeira Parte]
G
Na bruma leve das paixões que vêm de dentro
   C                       G
Tu vens chegando pra brincar no meu quintal
                   C
No teu cavalo, peito nu, cabelo ao vento
   Am             D7         G
O sol da manhã em frente ao meu portão

[Refrão]
   C                      G
Tu vens, tu vens, eu já escuto os teus sinais
   C                      G
Tu vens, tu vens, eu já escuto os teus sinais

[Segunda Parte]
G
A voz do anjo sussurrou no meu ouvido
    C                   G
Eu te perdoo, que o amor é mais forte
                  C
A voz do anjo sussurrou no meu ouvido
    Am            D7        G
E eu não duvido, que a vida tem norte

[Refrão]
   C                      G
Tu vens, tu vens, eu já escuto os teus sinais
   C                      G
Tu vens, tu vens, eu já escuto os teus sinais`,
  },
  {
    id: 'pais-e-filhos-legiao-urbana',
    title: 'Pais e Filhos',
    artist: 'Legião Urbana',
    originalKey: 'C',
    difficulty: 'Fácil',
    genre: 'Rock Nacional',
    timeSignature: '4/4',
    recommendedBpm: 125,
    capo: 0,
    chordsUsed: ['C', 'G/B', 'Am', 'F', 'Dm', 'G'],
    cifraClubUrl: 'https://www.cifraclub.com.br/legiao-urbana/pais-e-filhos/',
    toneSuggestions: {
      maleVoice: 'C (Tom Original)',
      femaleVoice: 'G (Transpor +7)',
      noBarreKey: 'C (Substituir F por Fmaj7 sem pestana)',
    },
    chordsText: `[Intro] C  G/B  Am  F  (2x)

[Primeira Parte]
C                 G/B          Am
Estátuas e cemitérios pelo caminho
               F            C
E os meus pais deitados aqui
           G/B            Am
Não pareço ninguém que você conheça
      F                   C
Eu não pertenço a lugar nenhum

[Pré-Refrão]
     Dm                    G
E se você quer saber o que estou sentindo
   Dm               G
Eu tenho medo do escuro
       Dm            G
E tenho medo de não ver a luz

[Refrão]
C            G/B               Am
É preciso amar as pessoas como se não houvesse amanhã
           F                      C
Porque se você parar pra pensar, na verdade não há
             G/B                Am
Sou uma gota d'água, sou um grão de areia
             F              C
Você me diz que seus pais não te entendem
              G/B           Am              F
Mas você não entende seus pais!

[Final]
C  G/B  Am  F  C`,
  },
  {
    id: 'evidencias-chitaozinho-xororo',
    title: 'Evidências',
    artist: 'Chitãozinho & Xororó',
    originalKey: 'E',
    difficulty: 'Médio',
    genre: 'Sertanejo',
    timeSignature: '4/4',
    recommendedBpm: 88,
    capo: 0,
    chordsUsed: ['E', 'B/D#', 'C#m', 'C#m/B', 'A', 'E/G#', 'F#m', 'B7'],
    cifraClubUrl: 'https://www.cifraclub.com.br/chitaozinho-xororo/evidencias/',
    toneSuggestions: {
      maleVoice: 'E (Tom Original)',
      femaleVoice: 'A (Transpor +5)',
      noBarreKey: 'G (Transpor +3 sem pestanas)',
    },
    chordsText: `[Intro] E  B/D#  C#m  C#m/B  A  E/G#  F#m  B7

[Primeira Parte]
E                      B/D#
Quando eu digo que não quero mais você
C#m                 C#m/B
 É porque eu te quero
A                    E/G#
Eu finjo que não ouço o que você me diz
F#m             B7
 Mas eu espero

E                   B/D#
Quando eu fujo do seu olhar
C#m                   C#m/B
 É que eu fico com medo de me entregar
A                    E/G#
Eu invento desculpas pra te abraçar
F#m                 B7
 Eu te amo tanto que nem sei falar

[Refrão]
      E
E nessa loucura de dizer que não te quero
    B/D#
Vou negando as aparências, disfarçando as evidências
   C#m                            C#m/B
Mas pra que viver fingindo se eu não posso enganar meu coração?
 A
Eu sei que te amo!
     E/G#
Chega de mentiras, de negar o meu desejo
     F#m                             B7
Eu te quero mais que tudo, eu preciso do seu beijo
                 E    B/D#  C#m  A  B7
Eu entrego a minha vida pra você!`,
  },
  {
    id: 'metamorfose-ambulante-raul-seixas',
    title: 'Metamorfose Ambulante',
    artist: 'Raul Seixas',
    originalKey: 'C',
    difficulty: 'Fácil',
    genre: 'Rock Nacional',
    timeSignature: '4/4',
    recommendedBpm: 118,
    capo: 0,
    chordsUsed: ['C', 'G', 'F', 'Am'],
    cifraClubUrl: 'https://www.cifraclub.com.br/raul-seixas/metamorfose-ambulante/',
    toneSuggestions: {
      maleVoice: 'C (Tom Original)',
      femaleVoice: 'F (Transpor +5)',
      noBarreKey: 'C (Usar F7M no lugar de F)',
    },
    chordsText: `[Intro] C  G  F  C

[Primeira Parte]
C                     G
Prefiro ser essa metamorfose ambulante
F                              C
Do que ter aquela velha opinião formada sobre tudo
C                     G
Prefiro ser essa metamorfose ambulante
F                              C
Do que ter aquela velha opinião formada sobre tudo

[Refrão]
    Am                       F
Eu quero dizer agora o oposto do que eu disse antes
    Am                     F           G
Eu prefiro ser essa metamorfose ambulante

[Outro]
C                     G
Sobre o que é o amor, sobre o que é o mandar
F                  C
Eu quero é viver e não ter a vergonha de ser feliz!`,
  },
  {
    id: 'leao-marilia-mendonca',
    title: 'Leão',
    artist: 'Marília Mendonça',
    originalKey: 'Am',
    difficulty: 'Médio',
    genre: 'Sertanejo / Pop',
    timeSignature: '4/4',
    recommendedBpm: 90,
    capo: 0,
    chordsUsed: ['Am', 'F', 'C', 'G'],
    cifraClubUrl: 'https://www.cifraclub.com.br/marilia-mendonca/leao/',
    toneSuggestions: {
      maleVoice: 'Em (Transpor -5)',
      femaleVoice: 'Am (Tom Original)',
      noBarreKey: 'Am (Acordes Am, C, G e Fmaj7)',
    },
    chordsText: `[Intro] Am  F  C  G (2x)

[Primeira Parte]
Am                          F
Dei valor pra quem me valorizou
                          C
Dei amor pra quem me deu amor
                          G
Tudo o que eu fiz por você nunca bastou

[Refrão]
             Am
Se é pra eu virar leão
               F
Eu viro pra te proteger
               C
Se é pra eu virar dragão
               G
Eu viro pra te defender
            Am                    F
Mas não venha pisar na minha caminhada
                     C               G
Que a leoa quando ataca não deixa nada!`,
  },
  {
    id: 'nao-quero-dinheiro-tim-maia',
    title: 'Não Quero Dinheiro (Só Quero Amar)',
    artist: 'Tim Maia',
    originalKey: 'C',
    difficulty: 'Fácil',
    genre: 'Soul / MPB',
    timeSignature: '4/4',
    recommendedBpm: 122,
    capo: 0,
    chordsUsed: ['C', 'Em', 'Dm', 'G7', 'F'],
    cifraClubUrl: 'https://www.cifraclub.com.br/tim-maia/nao-quero-dinheiro/',
    toneSuggestions: {
      maleVoice: 'C (Tom Original)',
      femaleVoice: 'G (Transpor +7)',
      noBarreKey: 'C (Sem pestanas necessárias)',
    },
    chordsText: `[Intro] C  Em  Dm  G7 (2x)

[Primeira Parte]
C             Em               Dm       G7
Vou pedir pra você voltar, vou pedir pra você ficar
C               Em            Dm      G7
Eu te amo, eu te quero bem, eu preciso de você também

[Refrão]
F                   G7            C
Aonde quer que eu vá, te levo no meu pensamento
F                   G7           C
Não quero dinheiro, eu só quero amar!
F                   G7            C
Aonde quer que eu vá, te levo no meu pensamento
Dm                  G7           C
Não quero dinheiro, eu só quero amar!`,
  },
  {
    id: 'yellow-coldplay',
    title: 'Yellow',
    artist: 'Coldplay',
    originalKey: 'B',
    difficulty: 'Médio',
    genre: 'Rock Internacional',
    timeSignature: '4/4',
    recommendedBpm: 88,
    capo: 2,
    chordsUsed: ['A', 'E', 'D', 'F#m'],
    cifraClubUrl: 'https://www.cifraclub.com.br/coldplay/yellow/',
    toneSuggestions: {
      maleVoice: 'B (Com Capo na 2ª casa toque em A)',
      femaleVoice: 'D (Transpor +3)',
      noBarreKey: 'G (Transpor com Capo)',
    },
    chordsText: `[Intro] A  E  D  A  (Com Capo na 2ª casa)

[Verse 1]
A
Look at the stars
                     E
Look how they shine for you
                      D
And everything you do
                     A
Yeah, they were all Yellow

[Verse 2]
A
I came along
                    E
I wrote a song for you
                     D
And all the things you do
                   A
And it was called Yellow

[Chorus]
D                 F#m                   E
  And your skin, oh yeah, your skin and bones
D              F#m            E
  Turn into something beautiful
D               F#m             E              D
  And you know, for you, I'd bleed myself dry
                  A
For you, I'd bleed myself dry`,
  },
  {
    id: 'lugar-secreto-gabriela-rocha',
    title: 'Lugar Secreto',
    artist: 'Gabriela Rocha',
    originalKey: 'C#m',
    difficulty: 'Médio',
    genre: 'Gospel',
    timeSignature: '4/4',
    recommendedBpm: 72,
    capo: 0,
    chordsUsed: ['C#m', 'A', 'E', 'B'],
    cifraClubUrl: 'https://www.cifraclub.com.br/gabriela-rocha/lugar-secreto/',
    toneSuggestions: {
      maleVoice: 'Am (Transpor -4)',
      femaleVoice: 'C#m (Tom Original)',
      noBarreKey: 'Am (Am, F, C, G)',
    },
    chordsText: `[Intro] C#m  A  E  B (2x)

[Primeira Parte]
C#m                 A
Tu és a minha luz, a minha salvação
E                     B
De quem terei medo? Tu és a minha força

[Refrão]
C#m                    A
Quero conhecer-te mais, entrar no lugar secreto
E                      B
E me prostrar aos teus pés, Jesus!
C#m                  A
Tuas vestes cheiram a nardo e louvor
E                     B
Não há outro nome como o Teu!`,
  },
];
