import React from 'react';

function HomePage() {
    return (
        <div className="homepage">
            {/* HERO SECTION */}
            <section className="hero">
                <video autoPlay muted loop className="hero-video">
                    <source src="/hero-bg.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1>MARSIA 2026</h1>
                    <p className="hero-subtitle">Festival International<br/>Court-métrage IA</p>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">127</span>
                            <span>Films</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">24</span>
                            <span>Pays</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">15k€</span>
                            <span>Prix</span>
                        </div>
                    </div>
                    <div className="hero-buttons">
                        <button className="btn-primary btn-large">Participer</button>
                        <button className="btn-secondary btn-large">Sélection</button>
                    </div>
                </div>
            </section>

            {/* FILMS SELECTION */}
            <section className="films-section">
                <h2>Sélection Officielle</h2>
                <div className="films-grid">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="film-card">
                            <div className="film-poster"></div>
                            <div className="film-info">
                                <h3>Film {i}</h3>
                                <p>Réalisateur • France</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* INSCRIPTION CALL TO ACTION */}
            <section className="cta-section">
                <h2>Participez à MARSIA 2026</h2>
                <p>Déposez votre court-métrage IA avant le 31 mars</p>
                <button className="btn-primary btn-xl">S'inscrire gratuitement</button>
            </section>
        </div>
    );
}

export default HomePage;
