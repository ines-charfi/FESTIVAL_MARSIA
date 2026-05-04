import React from 'react';

function PalmaresPage() {
    // Données factices pour les gagnants (tu pourras les lier à ta base de données plus tard)
    const winners = [
        {
            category: "Grand Prix du Jury",
            title: "L'Éveil de Mars",
            director: "Sofia Alami",
            year: "2026",
            image: "/posters/film1.jpg",
            description: "Une exploration visuelle époustouflante générée par IA sur la colonisation martienne.",
            awardIcon: "🏆"
        },
        {
            category: "Meilleure Direction Artistique",
            title: "Néon Dreams",
            director: "Marc Morel",
            year: "2026",
            image: "/posters/film2.jpg",
            description: "Un court-métrage cyberpunk récompensé pour son esthétique IA unique.",
            awardIcon: "🎨"
        },
        {
            category: "Prix du Public",
            title: "L'Algorithme Humain",
            director: "Lucas Bernard",
            year: "2026",
            image: "/posters/film3.jpg",
            description: "Le coup de cœur des spectateurs de cette édition MARSIA.",
            awardIcon: "⭐"
        }
    ];

    return (
        <div className="palmares-page">
            <header className="palmares-header">
                <h1>Palmarès MARSIA 2026</h1>
                <p>Découvrez les chefs-d'œuvre récompensés par notre jury international et le public.</p>
            </header>

            <div className="winners-container">
                {winners.map((winner, index) => (
                    <div key={index} className="winner-card">
                        <div className="winner-badge">
                            <span className="icon">{winner.awardIcon}</span>
                            <span className="category">{winner.category}</span>
                        </div>

                        <div className="winner-content">
                            <div className="winner-image" style={{ backgroundImage: `url(${winner.image})` }}>
                                <div className="winner-overlay">
                                    <button className="btn-play">▶ Voir le film</button>
                                </div>
                            </div>

                            <div className="winner-info">
                                <h2>{winner.title}</h2>
                                <h3>Par {winner.director}</h3>
                                <p className="winner-desc">{winner.description}</p>
                                <span className="winner-year">Édition {winner.year}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="previous-editions">
                <h3>Archives des lauréats</h3>
                <p>Consultez les gagnants des années précédentes (Bientôt disponible).</p>
            </section>
        </div>
    );
}

export default PalmaresPage;