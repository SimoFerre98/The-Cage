import { useState } from 'react';
import GlassEffect from './GlassEffect';

const CARDS = [
  {
    id: 'penalty',
    title: 'PENALTY',
    emoji: '🎯',
    description: 'La tua squadra ottiene un calcio di rigore, così, senza nessun apparente merito sportivo.',
    image: '/cards/penalty.webp',
    glowColor: 'rgba(239, 68, 68, 0.5)', // Red
    accentColor: '#ef4444'
  },
  {
    id: 'shootout',
    title: 'SHOOTOUT',
    emoji: '⚡',
    description: 'Scegli un giocatore: partirà da centrocampo e avrà 5 secondi per battere il portiere in un 1 vs 1 da brividi. (Praticamente FIFA Street, ma più casereccio)',
    image: '/cards/shootout.webp',
    glowColor: 'rgba(245, 158, 11, 0.5)', // Gold/Amber
    accentColor: '#f59e0b'
  },
  {
    id: 'suspension',
    title: 'SUSPENSION',
    emoji: '⛔',
    description: 'Scegli un avversario: dovrà lasciare il campo per 3 minuti. Potrà usare il suo tempo per riflettere sui suoi errori (adolescenziali).',
    image: '/cards/suspension.webp',
    glowColor: 'rgba(139, 92, 246, 0.5)', // Purple
    accentColor: '#8b5cf6'
  },
  {
    id: 'goalx2',
    title: 'GOAL X2',
    emoji: '🔥',
    description: 'Per i prossimi 3 minuti ogni gol della tua squadra vale doppio. Il momento ideale per tirare da qualsiasi posizione senza alcun motivo e far incazzare tutti i tuoi compagni.',
    image: '/cards/goalx2.webp',
    glowColor: 'rgba(244, 63, 94, 0.5)', // Rose/Red
    accentColor: '#f43f5e'
  },
  {
    id: 'starplayer',
    title: 'STAR PLAYER',
    emoji: '🌟',
    description: 'Scegli il tuo campione: il suo prossimo gol varrà doppio. Anche quello brutto. Soprattutto quello brutto',
    image: '/cards/starplayer.webp',
    glowColor: 'rgba(6, 182, 212, 0.5)', // Cyan
    accentColor: '#06b6d4'
  },
  {
    id: 'joker',
    title: 'JOKER',
    emoji: '🃏',
    description: 'La carta più potente: scegli liberamente una qualsiasi delle carte disponibili e usala al momento perfetto. (Statisticamente improbabile. Fastidiosamente efficace).',
    image: '/cards/joker.webp',
    glowColor: 'rgba(236, 72, 153, 0.5)', // Magenta/Pink
    accentColor: '#ec4899'
  }
];

export default function CarteIsland() {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="w-full">
      {/* Informative Header / Instructions */}
      <GlassEffect className="info-instruction-badge mb-8">
        <span>💡</span>
        <span>Clicca o tocca una carta per girarla e scoprirne il potere speciale e le regole!</span>
      </GlassEffect>

      {/* Cards Grid */}
      <div className="carte-grid animate-stagger">
        {CARDS.map((card, i) => {
          const isFlipped = !!flippedCards[card.id];
          return (
            <div 
              key={card.id}
              className={`card-perspective-container ${isFlipped ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip(card.id)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="card-inner-3d">
                {/* Front Side: Card Image */}
                <div className="card-front">
                  <img 
                    src={card.image} 
                    alt={card.title} 
                    loading="lazy"
                  />
                </div>

                {/* Back Side: Card Info & Rules */}
                <div className="card-back">
                  {/* Custom Background Glow */}
                  <div 
                    className="card-back-glow"
                    style={{ backgroundColor: card.glowColor }}
                  />

                  {/* Title & Emoji */}
                  <div>
                    <div className="card-back-emoji">{card.emoji}</div>
                    <h3 
                      className="card-back-title"
                      style={{ color: card.accentColor }}
                    >
                      {card.title}
                    </h3>
                  </div>

                  {/* Rule Text */}
                  <p className="card-back-desc">
                    {card.description}
                  </p>

                  {/* Action / Help Prompt */}
                  <div className="card-back-action">
                    Tocca per girare 🔄
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
