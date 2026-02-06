import React from 'react';

function HomePage({ setPage }) {
    const filmsData = [
        { id: 1, title: "Film 1", director: "Réalisateur 1", country: "France", poster: "/posters/film1.jpg" },
        { id: 2, title: "Film 2", director: "Réalisateur 2", country: "France", poster: "/posters/film2.jpg" },
        { id: 3, title: "Film 3", director: "Réalisateur 3", country: "France", poster: "/posters/film3.jpg" },
        { id: 4, title: "Film 4", director: "Réalisateur 4", country: "France", poster: "/posters/film4.jpg" },
        { id: 5, title: "Film 5", director: "Réalisateur 5", country: "France", poster: "/posters/film5.jpg" },
        { id: 6, title: "Film 6", director: "Réalisateur 6", country: "France", poster: "/posters/film6.jpg" },
    ];

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
                        <button className="btn-primary btn-large" onClick={() => setPage('soumission-film')}>
                            Participer
                        </button>
                        <button className="btn-secondary btn-large" onClick={() => setPage('palmares')}>
                            Sélection
                        </button>
                    </div>
                </div>
            </section>

            {/* FILMS SELECTION GRILLE */}
            <section className="films-section">
                <h2>Sélection Officielle</h2>
                <div className="films-grid">
                    {filmsData.map(film => (
                        <div key={film.id} className="film-card">
                            <div className="film-poster" style={{ backgroundImage: `url(${film.poster})` }}></div>
                            <div className="film-info">
                                <h3>{film.title}</h3>
                                <p>{film.director} • {film.country}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* INSCRIPTION CALL TO ACTION */}
            <section className="cta-section">
                <h2>Participez à MARSIA 2026</h2>
                <p>Déposez votre court-métrage IA avant le 31 mars</p>
                <button className="btn-primary btn-xl" onClick={() => setPage('register')}>
                    S'inscrire gratuitement
                </button>
            </section>
        </div>
    );
}

export default HomePage;
